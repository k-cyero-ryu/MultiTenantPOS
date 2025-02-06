import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

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

  // Subsidiary Management
  app.get("/api/subsidiaries", requireMHCAdmin, async (req, res) => {
    const subsidiaries = await storage.listSubsidiaries();
    res.json(subsidiaries);
  });

  app.post("/api/subsidiaries", requireMHCAdmin, async (req, res) => {
    const subsidiary = await storage.createSubsidiary(req.body);
    res.status(201).json(subsidiary);
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
