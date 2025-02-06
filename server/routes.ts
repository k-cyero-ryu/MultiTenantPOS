import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import express from 'express';

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

  const subsidiaryId = parseInt(req.params.subsidiaryId);
  if (
    req.user.role !== "mhc_admin" &&
    req.user.subsidiaryId !== subsidiaryId
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

  // Activity Logs
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    const logs = await storage.listActivityLogs(
      req.user.role === "mhc_admin" ? undefined : req.user.subsidiaryId,
    );
    res.json(logs);
  });

  const httpServer = createServer(app);
  return httpServer;
}