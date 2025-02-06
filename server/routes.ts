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
      const inventory = await storage.createInventory({
        ...req.body,
        subsidiaryId: parseInt(req.params.subsidiaryId),
      });
      res.status(201).json(inventory);
    },
  );

  app.patch(
    "/api/subsidiaries/:subsidiaryId/inventory/:id",
    requireSubsidiaryAccess,
    async (req, res) => {
      const inventory = await storage.updateInventory(
        parseInt(req.params.id),
        req.body,
      );
      res.json(inventory);
    },
  );

  app.delete(
    "/api/subsidiaries/:subsidiaryId/inventory/:id",
    requireSubsidiaryAccess,
    async (req, res) => {
      await storage.deleteInventory(parseInt(req.params.id));
      res.sendStatus(204);
    },
  );

  // Sales Management
  app.post(
    "/api/subsidiaries/:subsidiaryId/sales",
    requireSubsidiaryAccess,
    async (req, res) => {
      const sale = await storage.createSale({
        ...req.body,
        subsidiaryId: parseInt(req.params.subsidiaryId),
        userId: req.user.id,
      });
      res.status(201).json(sale);
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
      if (req.user.role !== "subsidiary_admin") {
        return res.status(403).json({ message: "Only subsidiary admins can view users" });
      }

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
          role: "staff", // Force role to be staff
          password: hashedPassword,
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
    const logs = await storage.listActivityLogs(
      req.user.role === "mhc_admin" ? undefined : req.user.subsidiaryId,
    );
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

  // Add after the existing routes
  app.get("/api/reports/:type", requireMHCAdmin, async (req, res) => {
    const { type } = req.params;
    const { format, timeRange } = req.query;

    try {
      let data;
      const now = new Date();
      let startDate = new Date();

      // Calculate start date based on time range
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 1); // Default to last month
      }

      switch (type) {
        case 'sales': {
          // Get all sales within the date range
          const sales = await storage.listSales();
          data = sales.filter(sale => new Date(sale.timestamp) >= startDate);
          break;
        }
        case 'inventory': {
          // Get current inventory status
          const subsidiaries = await storage.listSubsidiaries();
          const inventoryPromises = subsidiaries.map(subsidiary =>
            storage.listInventoryBySubsidiary(subsidiary.id)
          );
          const inventoryBySubsidiary = await Promise.all(inventoryPromises);
          data = inventoryBySubsidiary.flat();
          break;
        }
        case 'activity': {
          // Get activity logs within the date range
          const logs = await storage.listActivityLogs();
          data = logs.filter(log => new Date(log.timestamp) >= startDate);
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid report type" });
      }

      // Format data based on requested format
      if (format === 'csv') {
        // Convert data to CSV format
        const csv = convertToCSV(data);
        res.header('Content-Type', 'text/csv');
        res.attachment(`${type}-report.csv`);
        return res.send(csv);
      } else if (format === 'pdf') {
        // Send JSON for now, PDF generation will be implemented later
        res.json(data);
      } else {
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
    const rows = data.map(obj => headers.map(header => obj[header]));

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  const httpServer = createServer(app);
  return httpServer;
}