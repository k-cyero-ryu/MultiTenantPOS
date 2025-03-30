import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth"; // Add hashPassword import
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import express from 'express';
import { type Sale } from "@shared/schema"; // Add Sale type import

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireMHCAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || req.user.role !== "mhc_admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

function requireSubsidiaryAccess(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const subsidiaryId = parseInt(req.params.subsidiaryId || req.params.id);
  if (
    req.user?.role !== "mhc_admin" &&
    req.user?.subsidiaryId !== subsidiaryId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Ensure uploads directory exists
  app.use(express.static('uploads'));
  app.use(express.json()); //added to handle json body


  // Subsidiary Management
  app.get("/api/subsidiaries", requireMHCAdmin, async (req, res) => {
    const subsidiaries = await storage.listSubsidiaries();
    res.json(subsidiaries);
  });

  app.post("/api/subsidiaries", requireMHCAdmin, upload.single('logo'), async (req, res) => {
    try {
      const subsidiaryData = {
        name: req.body.name,
        taxId: req.body.taxId,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        city: req.body.city,
        country: req.body.country,
        status: req.body.status === 'true',
        logo: req.file ? `/uploads/${req.file.filename}` : undefined
      };

      const subsidiary = await storage.createSubsidiary(subsidiaryData);

      // Log the activity
      await storage.createActivityLog({
        userId: req.user!.id,
        action: "CREATE_SUBSIDIARY",
        details: `Created subsidiary: ${subsidiary.name}`,
        subsidiaryId: subsidiary.id,
        timestamp: new Date(),
      });

      res.status(201).json(subsidiary);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/subsidiaries/:id", requireMHCAdmin, async (req, res) => {
    const subsidiary = await storage.updateSubsidiary(
      parseInt(req.params.id),
      req.body,
    );
    res.json(subsidiary);
  });

  // Add this after the existing subsidiary routes
  app.get("/api/subsidiaries/:id", requireSubsidiaryAccess, async (req, res) => {
    const subsidiary = await storage.getSubsidiary(parseInt(req.params.id));
    if (!subsidiary) {
      return res.status(404).json({ message: "Subsidiary not found" });
    }
    res.json(subsidiary);
  });

  // Inventory Management
  app.get(
    "/api/subsidiaries/:subsidiaryId/inventory",
    requireSubsidiaryAccess,
    async (req, res) => {
      const inventory = await storage.listInventoryBySubsidiary(
        parseInt(req.params.subsidiaryId),
      );
      res.json(inventory);
    },
  );

  app.post(
    "/api/subsidiaries/:subsidiaryId/inventory",
    requireSubsidiaryAccess,
    async (req, res) => {
      try {
        const inventory = await storage.createInventory({
          ...req.body,
          subsidiaryId: parseInt(req.params.subsidiaryId),
        });

        // Log the activity
        await storage.createActivityLog({
          userId: req.user!.id,
          action: "CREATE_INVENTORY",
          details: `Created inventory item: ${inventory.name} with quantity ${inventory.quantity}`,
          subsidiaryId: parseInt(req.params.subsidiaryId),
          timestamp: new Date(),
        });

        res.status(201).json(inventory);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/subsidiaries/:subsidiaryId/inventory/:id",
    requireSubsidiaryAccess,
    async (req, res) => {
      try {
        const oldInventory = await storage.getInventory(parseInt(req.params.id));
        const inventory = await storage.updateInventory(
          parseInt(req.params.id),
          req.body,
        );

        // Log the activity
        await storage.createActivityLog({
          userId: req.user!.id,
          action: "UPDATE_INVENTORY",
          details: `Updated inventory item: ${inventory.name} - Quantity changed from ${oldInventory?.quantity || 0} to ${inventory.quantity}`,
          subsidiaryId: parseInt(req.params.subsidiaryId),
          timestamp: new Date(),
        });

        res.json(inventory);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/subsidiaries/:subsidiaryId/inventory/:id",
    requireSubsidiaryAccess,
    async (req, res) => {
      try {
        const inventory = await storage.getInventory(parseInt(req.params.id));
        await storage.deleteInventory(parseInt(req.params.id));

        // Log the activity
        await storage.createActivityLog({
          userId: req.user!.id,
          action: "DELETE_INVENTORY",
          details: `Deleted inventory item: ${inventory?.name}`,
          subsidiaryId: parseInt(req.params.subsidiaryId),
          timestamp: new Date(),
        });

        res.sendStatus(204);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  // Sales Management
  app.post(
    "/api/subsidiaries/:subsidiaryId/sales",
    requireSubsidiaryAccess,
    async (req, res) => {
      try {
        const sale = await storage.createSale({
          ...req.body,
          subsidiaryId: parseInt(req.params.subsidiaryId),
          userId: req.user!.id,
        });

        // Log the activity
        await storage.createActivityLog({
          userId: req.user!.id,
          action: "CREATE_SALE",
          details: `Created sale: ${sale.quantity} items at $${sale.salePrice}`,
          subsidiaryId: parseInt(req.params.subsidiaryId),
          timestamp: new Date(),
        });

        res.status(201).json(sale);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/subsidiaries/:subsidiaryId/sales",
    requireSubsidiaryAccess,
    async (req, res) => {
      const sales = await storage.listSalesBySubsidiary(
        parseInt(req.params.subsidiaryId),
      );
      res.json(sales);
    },
  );

  // Add after existing sales routes
  app.get("/api/sales", requireMHCAdmin, async (req, res) => {
    const subsidiaries = await storage.listSubsidiaries();
    let allSales: Sale[] = [];

    // Gather sales from all subsidiaries
    for (const subsidiary of subsidiaries) {
      const subsidiarySales = await storage.listSalesBySubsidiary(subsidiary.id);
      allSales = [...allSales, ...subsidiarySales];
    }

    res.json(allSales);
  });

  // Add route to get total inventory count
  app.get("/api/inventory/total", requireMHCAdmin, async (req, res) => {
    const subsidiaries = await storage.listSubsidiaries();
    let totalProducts = 0;

    // Count inventory items across all subsidiaries
    for (const subsidiary of subsidiaries) {
      const subsidiaryInventory = await storage.listInventoryBySubsidiary(subsidiary.id);
      totalProducts += subsidiaryInventory.length;
    }

    res.json({ totalProducts });
  });

  // User Management for Subsidiaries
  app.get(
    "/api/subsidiaries/:subsidiaryId/users",
    requireSubsidiaryAccess,
    async (req, res) => {
      // Allow any user with subsidiary access to view users 
      // This includes MHC admins, subsidiary admins, and staff members of the subsidiary
      const subsidiaryId = parseInt(req.params.subsidiaryId);
      const users = await storage.listUsersBySubsidiary(subsidiaryId);
      res.json(users);
    }
  );

  app.post(
    "/api/subsidiaries/:subsidiaryId/users",
    requireSubsidiaryAccess,
    async (req, res) => {
      if (req.user?.role !== "subsidiary_admin") {
        return res.status(403).json({ message: "Only subsidiary admins can create users" });
      }

      const subsidiaryId = parseInt(req.params.subsidiaryId);

      try {
        // Check if username already exists
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).send("Username already exists");
        }

        const hashedPassword = await hashPassword(req.body.password);
        const user = await storage.createUser({
          ...req.body,
          subsidiaryId,
          role: "staff",
          password: hashedPassword,
        });

        // Log the activity
        await storage.createActivityLog({
          userId: req.user.id,
          action: "CREATE_USER",
          details: `Created user: ${user.username}`,
          subsidiaryId: subsidiaryId,
          timestamp: new Date(),
        });

        res.status(201).json(user);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Add these routes after the existing user management routes
  app.patch(
    "/api/subsidiaries/:subsidiaryId/users/:userId",
    requireSubsidiaryAccess,
    async (req, res) => {
      if (req.user?.role !== "subsidiary_admin") {
        return res.status(403).json({ message: "Only subsidiary admins can modify users" });
      }

      const subsidiaryId = parseInt(req.params.subsidiaryId);
      const userId = parseInt(req.params.userId);

      try {
        // Verify user belongs to this subsidiary
        const user = await storage.getUser(userId);
        if (!user || user.subsidiaryId !== subsidiaryId) {
          return res.status(404).json({ message: "User not found" });
        }

        // If password is being updated, hash it
        const updates = { ...req.body };
        if (updates.password) {
          updates.password = await hashPassword(updates.password);
        }

        const updatedUser = await storage.updateUser(userId, updates);
        res.json(updatedUser);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.delete(
    "/api/subsidiaries/:subsidiaryId/users/:userId",
    requireSubsidiaryAccess,
    async (req, res) => {
      if (req.user?.role !== "subsidiary_admin") {
        return res.status(403).json({ message: "Only subsidiary admins can delete users" });
      }

      const subsidiaryId = parseInt(req.params.subsidiaryId);
      const userId = parseInt(req.params.userId);

      try {
        // Verify user belongs to this subsidiary
        const user = await storage.getUser(userId);
        if (!user || user.subsidiaryId !== subsidiaryId) {
          return res.status(404).json({ message: "User not found" });
        }

        await storage.deleteUser(userId);
        res.sendStatus(204);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Activity Logs
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    // Only pass a subsidiaryId if the user is not an MHC admin and has a subsidiaryId
    const subsidiaryId = req.user?.role === "mhc_admin" ? 
      undefined : 
      (req.user?.subsidiaryId || undefined);
      
    const logs = await storage.listActivityLogs(subsidiaryId);
    res.json(logs);
  });

  // Add this route after the existing user management routes
  app.get("/api/users", requireMHCAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update the reports endpoint to handle custom date ranges
  app.get("/api/reports/:type", requireMHCAdmin, async (req, res) => {
    const { type } = req.params;
    const { format = 'json', timeRange, startDate, endDate } = req.query;

    try {
      let data;
      const now = new Date();
      let startDateTime = new Date();

      // Calculate start date based on parameters
      if (startDate && endDate) {
        // Custom date range
        startDateTime = new Date(startDate as string);
        const endDateTime = new Date(endDate as string);
        // Set end date to end of day
        endDateTime.setHours(23, 59, 59, 999);
        now.setTime(endDateTime.getTime());
      } else {
        // Predefined ranges
        switch (timeRange) {
          case 'week':
            startDateTime.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDateTime.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDateTime.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDateTime.setMonth(now.getMonth() - 1); // Default to last month
        }
        // Set end date to end of current day
        now.setHours(23, 59, 59, 999);
      }

      // Gather data based on report type
      switch (type) {
        case 'sales': {
          // Get all subsidiaries and their sales
          const subsidiaries = await storage.listSubsidiaries();
          let allSales: Sale[] = [];
          const users = await storage.listUsers();

          for (const subsidiary of subsidiaries) {
            const subsidiarySales = await storage.listSalesBySubsidiary(subsidiary.id);
            allSales = [...allSales, ...subsidiarySales];
          }

          // Filter by date and format data
          data = allSales
            .filter(sale => {
              const saleDate = new Date(sale.timestamp);
              return saleDate >= startDateTime && saleDate <= now;
            })
            .map(sale => {
              const subsidiary = subsidiaries.find(s => s.id === sale.subsidiaryId);
              const user = users.find(u => u.id === sale.userId);
              return {
                Date: new Date(sale.timestamp).toLocaleDateString(),
                'Subsidiary': subsidiary?.name || 'Unknown',
                'Sold By': user?.username || 'Unknown',
                'Quantity': sale.quantity,
                'Sale Price': `$${sale.salePrice.toFixed(2)}`,
                'Total': `$${(sale.quantity * sale.salePrice).toFixed(2)}`
              };
            });
          break;
        }
        case 'inventory': {
          // Get current inventory status for all subsidiaries
          const subsidiaries = await storage.listSubsidiaries();
          const inventoryPromises = subsidiaries.map(async subsidiary => {
            const items = await storage.listInventoryBySubsidiary(subsidiary.id);
            return items.map(item => ({
              'Subsidiary': subsidiary.name,
              'Product Name': item.name,
              'SKU': item.sku,
              'Quantity': item.quantity,
              'Sale Price': `$${item.salePrice.toFixed(2)}`,
              'Total Value': `$${(item.quantity * item.salePrice).toFixed(2)}`
            }));
          });

          data = (await Promise.all(inventoryPromises)).flat();
          break;
        }
        case 'activity': {
          // Get activity logs with user and subsidiary details
          const logs = await storage.listActivityLogs();
          const subsidiaries = await storage.listSubsidiaries();
          const users = await storage.listUsers();

          data = logs
            .filter(log => {
              const logDate = new Date(log.timestamp);
              return logDate >= startDateTime && logDate <= now;
            })
            .map(log => {
              const subsidiary = subsidiaries.find(s => s.id === log.subsidiaryId);
              const user = users.find(u => u.id === log.userId);
              return {
                Date: new Date(log.timestamp).toLocaleDateString(),
                'Subsidiary': subsidiary?.name || 'MHC',
                'User': user?.username || 'System',
                'Action': log.action,
                'Details': log.details
              };
            });
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid report type" });
      }

      // Format and send response based on requested format
      if (format === 'csv') {
        const csv = convertToCSV(data);
        res.header('Content-Type', 'text/csv');
        res.attachment(`${type}-report-${timeRange || 'custom'}.csv`);
        return res.send(csv);
      } else if (format === 'pdf') {
        // Create an HTML document that looks like a PDF report
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${type.charAt(0).toUpperCase() + type.slice(1)} Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .report-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .metadata {
                color: #666;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
              }
              .summary {
                margin: 20px 0;
                padding: 15px;
                background: #f9f9f9;
                border-radius: 4px;
              }
              @media print {
                body { margin: 0; }
                .header { margin-top: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="report-title">${type.charAt(0).toUpperCase() + type.slice(1)} Report</div>
              <div class="metadata">
                Generated on ${new Date().toLocaleDateString()}<br>
                Time Range: ${timeRange === 'custom' 
                  ? `${startDateTime.toLocaleDateString()} to ${now.toLocaleDateString()}`
                  : timeRange}
              </div>
            </div>

            <div class="summary">
              <strong>Summary:</strong><br>
              Total Records: ${data.length}<br>
              Date Range: ${startDateTime.toLocaleDateString()} - ${now.toLocaleDateString()}
            </div>

            <table>
              <thead>
                <tr>
                  ${Object.keys(data[0] || {}).map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;

        res.header('Content-Type', 'text/html');
        res.attachment(`${type}-report-${timeRange || 'custom'}.html`);
        return res.send(html);

      } else {
        // JSON format for preview
        res.json(data);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Helper function to convert data to CSV format
  function convertToCSV(data: any[]) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
      headers.map(header => {
        const value = obj[header];
        // Handle values that might contain commas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      })
    );

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  // Database Configuration API
  app.get("/api/config/database", requireMHCAdmin, (req, res) => {
    try {
      // Read from the configuration file
      const fs = require('fs');
      const path = require('path');
      const configPath = path.resolve(process.cwd(), 'db.config.mjs');
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      
      // Extract engine value using a simple regex
      const engineMatch = fileContent.match(/engine:\s*['"]([^'"]+)['"]/);
      const engine = engineMatch ? engineMatch[1] : 'postgresql';
      
      // Extract PostgreSQL configuration
      const pgHostMatch = fileContent.match(/postgresql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/);
      const pgPortMatch = fileContent.match(/postgresql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/);
      const pgDatabaseMatch = fileContent.match(/postgresql:[\s\S]*?database:[\s\S]*?['"]([^'"]+)['"]/);
      const pgUserMatch = fileContent.match(/postgresql:[\s\S]*?user:[\s\S]*?['"]([^'"]+)['"]/);
      
      // Extract MySQL configuration
      const mysqlHostMatch = fileContent.match(/mysql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/);
      const mysqlPortMatch = fileContent.match(/mysql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/);
      const mysqlDatabaseMatch = fileContent.match(/mysql:[\s\S]*?database:[\s\S]*?['"]([^'"]+)['"]/);
      const mysqlUserMatch = fileContent.match(/mysql:[\s\S]*?user:[\s\S]*?['"]([^'"]+)['"]/);
      
      const dbConfig = {
        engine: engine,
        postgresql: {
          host: pgHostMatch ? pgHostMatch[1] : 'localhost',
          port: pgPortMatch ? pgPortMatch[1] : '5432',
          database: pgDatabaseMatch ? pgDatabaseMatch[1] : 'postgres',
          user: pgUserMatch ? pgUserMatch[1] : 'postgres',
        },
        mysql: {
          host: mysqlHostMatch ? mysqlHostMatch[1] : 'localhost',
          port: mysqlPortMatch ? mysqlPortMatch[1] : '3306',
          database: mysqlDatabaseMatch ? mysqlDatabaseMatch[1] : 'subsidiary_management',
          user: mysqlUserMatch ? mysqlUserMatch[1] : 'root',
        }
      };
      res.json(dbConfig);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to read database configuration", error: error.message });
    }
  });

  app.post("/api/config/database", requireMHCAdmin, (req, res) => {
    try {
      const { engine, postgresql, mysql } = req.body;
      
      // Validate engine type
      if (engine !== 'postgresql' && engine !== 'mysql') {
        return res.status(400).json({ message: "Invalid database engine. Must be 'postgresql' or 'mysql'" });
      }

      // Update the configuration file
      const fs = require('fs');
      const path = require('path');
      const configPath = path.resolve(process.cwd(), 'db.config.mjs');
      let fileContent = fs.readFileSync(configPath, 'utf-8');
      
      // Replace the engine value
      fileContent = fileContent.replace(
        /engine:\s*['"][^'"]+['"]/,
        `engine: '${engine}'`
      );
      
      // Update PostgreSQL configuration if provided
      if (postgresql) {
        if (postgresql.host) {
          fileContent = fileContent.replace(
            /postgresql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/,
            `postgresql: {\n    host: '${postgresql.host}'`
          );
        }
        
        if (postgresql.port) {
          fileContent = fileContent.replace(
            /postgresql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/,
            `postgresql: {\n    host: ${fileContent.match(/postgresql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    port: parseInt(process.env.PGPORT || '${postgresql.port}'`
          );
        }
        
        if (postgresql.database) {
          fileContent = fileContent.replace(
            /postgresql:[\s\S]*?database:[\s\S]*?['"]([^'"]+)['"]/,
            `postgresql: {\n    host: ${fileContent.match(/postgresql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    port: parseInt(process.env.PGPORT || '${fileContent.match(/postgresql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/)[1]}'),\n    user: ${fileContent.match(/postgresql:[\s\S]*?user:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    database: '${postgresql.database}'`
          );
        }
        
        if (postgresql.user) {
          fileContent = fileContent.replace(
            /postgresql:[\s\S]*?user:[\s\S]*?['"]([^'"]+)['"]/,
            `postgresql: {\n    host: ${fileContent.match(/postgresql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    port: parseInt(process.env.PGPORT || '${fileContent.match(/postgresql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/)[1]}'),\n    user: '${postgresql.user}'`
          );
        }
      }
      
      // Update MySQL configuration if provided
      if (mysql) {
        if (mysql.host) {
          fileContent = fileContent.replace(
            /mysql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/,
            `mysql: {\n    host: '${mysql.host}'`
          );
        }
        
        if (mysql.port) {
          fileContent = fileContent.replace(
            /mysql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/,
            `mysql: {\n    host: ${fileContent.match(/mysql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    port: parseInt(process.env.MYSQL_PORT || '${mysql.port}'`
          );
        }
        
        if (mysql.database) {
          fileContent = fileContent.replace(
            /mysql:[\s\S]*?database:[\s\S]*?['"]([^'"]+)['"]/,
            `mysql: {\n    host: ${fileContent.match(/mysql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    port: parseInt(process.env.MYSQL_PORT || '${fileContent.match(/mysql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/)[1]}'),\n    user: ${fileContent.match(/mysql:[\s\S]*?user:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    database: '${mysql.database}'`
          );
        }
        
        if (mysql.user) {
          fileContent = fileContent.replace(
            /mysql:[\s\S]*?user:[\s\S]*?['"]([^'"]+)['"]/,
            `mysql: {\n    host: ${fileContent.match(/mysql:[\s\S]*?host:[\s\S]*?['"]([^'"]+)['"]/)[1]},\n    port: parseInt(process.env.MYSQL_PORT || '${fileContent.match(/mysql:[\s\S]*?port:[\s\S]*?parseInt\([^'"]*['"]([^'"]+)['"]/)[1]}'),\n    user: '${mysql.user}'`
          );
        }
      }
      
      // Write the updated content back to the file
      fs.writeFileSync(configPath, fileContent);
      
      // Log the change for diagnostics
      console.log(`Database configuration updated to engine: ${engine}`);
      
      res.status(200).json({ 
        message: "Database configuration updated successfully", 
        note: "Server restart required for changes to take effect",
        engine
      });
    } catch (error: any) {
      console.error("Failed to update database configuration:", error);
      res.status(500).json({ message: "Failed to update database configuration", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}