import {
  type User,
  type InsertUser,
  type Subsidiary,
  type InsertSubsidiary,
  type Inventory,
  type InsertInventory,
  type Sale,
  type InsertSale,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Subsidiary Operations
  getSubsidiary(id: number): Promise<Subsidiary | undefined>;
  listSubsidiaries(): Promise<Subsidiary[]>;
  createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary>;
  updateSubsidiary(id: number, subsidiary: Partial<InsertSubsidiary>): Promise<Subsidiary>;
  
  // Inventory Operations
  getInventory(id: number): Promise<Inventory | undefined>;
  listInventoryBySubsidiary(subsidiaryId: number): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, inventory: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventory(id: number): Promise<void>;
  
  // Sales Operations
  createSale(sale: InsertSale): Promise<Sale>;
  listSalesBySubsidiary(subsidiaryId: number): Promise<Sale[]>;
  
  // Activity Log Operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listActivityLogs(subsidiaryId?: number): Promise<ActivityLog[]>;
  
  // Session Store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subsidiaries: Map<number, Subsidiary>;
  private inventory: Map<number, Inventory>;
  private sales: Map<number, Sale>;
  private activityLogs: Map<number, ActivityLog>;
  private currentIds: {
    users: number;
    subsidiaries: number;
    inventory: number;
    sales: number;
    activityLogs: number;
  };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.subsidiaries = new Map();
    this.inventory = new Map();
    this.sales = new Map();
    this.activityLogs = new Map();
    this.currentIds = {
      users: 1,
      subsidiaries: 1,
      inventory: 1,
      sales: 1,
      activityLogs: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Subsidiary Operations
  async getSubsidiary(id: number): Promise<Subsidiary | undefined> {
    return this.subsidiaries.get(id);
  }

  async listSubsidiaries(): Promise<Subsidiary[]> {
    return Array.from(this.subsidiaries.values());
  }

  async createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary> {
    const id = this.currentIds.subsidiaries++;
    const newSubsidiary = { ...subsidiary, id };
    this.subsidiaries.set(id, newSubsidiary);
    return newSubsidiary;
  }

  async updateSubsidiary(
    id: number,
    subsidiary: Partial<InsertSubsidiary>,
  ): Promise<Subsidiary> {
    const existing = await this.getSubsidiary(id);
    if (!existing) throw new Error("Subsidiary not found");
    const updated = { ...existing, ...subsidiary };
    this.subsidiaries.set(id, updated);
    return updated;
  }

  // Inventory Operations
  async getInventory(id: number): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async listInventoryBySubsidiary(subsidiaryId: number): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(
      (item) => item.subsidiaryId === subsidiaryId,
    );
  }

  async createInventory(inventory: InsertInventory): Promise<Inventory> {
    const id = this.currentIds.inventory++;
    const newInventory = { ...inventory, id };
    this.inventory.set(id, newInventory);
    return newInventory;
  }

  async updateInventory(
    id: number,
    inventory: Partial<InsertInventory>,
  ): Promise<Inventory> {
    const existing = await this.getInventory(id);
    if (!existing) throw new Error("Inventory item not found");
    const updated = { ...existing, ...inventory };
    this.inventory.set(id, updated);
    return updated;
  }

  async deleteInventory(id: number): Promise<void> {
    this.inventory.delete(id);
  }

  // Sales Operations
  async createSale(sale: InsertSale): Promise<Sale> {
    const id = this.currentIds.sales++;
    const newSale = { ...sale, id };
    this.sales.set(id, newSale);
    return newSale;
  }

  async listSalesBySubsidiary(subsidiaryId: number): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      (sale) => sale.subsidiaryId === subsidiaryId,
    );
  }

  // Activity Log Operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentIds.activityLogs++;
    const newLog = { ...log, id };
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  async listActivityLogs(subsidiaryId?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values());
    return subsidiaryId
      ? logs.filter((log) => log.subsidiaryId === subsidiaryId)
      : logs;
  }
}

export const storage = new MemStorage();
