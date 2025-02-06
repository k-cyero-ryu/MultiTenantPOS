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
  users,
  subsidiaries,
  inventory,
  sales,
  activityLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Subsidiary Operations
  async getSubsidiary(id: number): Promise<Subsidiary | undefined> {
    const [subsidiary] = await db.select().from(subsidiaries).where(eq(subsidiaries.id, id));
    return subsidiary;
  }

  async listSubsidiaries(): Promise<Subsidiary[]> {
    return db.select().from(subsidiaries);
  }

  async createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary> {
    const [newSubsidiary] = await db.insert(subsidiaries).values(subsidiary).returning();
    return newSubsidiary;
  }

  async updateSubsidiary(id: number, subsidiary: Partial<InsertSubsidiary>): Promise<Subsidiary> {
    const [updated] = await db
      .update(subsidiaries)
      .set(subsidiary)
      .where(eq(subsidiaries.id, id))
      .returning();
    if (!updated) throw new Error("Subsidiary not found");
    return updated;
  }

  // Inventory Operations
  async getInventory(id: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }

  async listInventoryBySubsidiary(subsidiaryId: number): Promise<Inventory[]> {
    return db.select().from(inventory).where(eq(inventory.subsidiaryId, subsidiaryId));
  }

  async createInventory(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory> {
    const [updated] = await db
      .update(inventory)
      .set(item)
      .where(eq(inventory.id, id))
      .returning();
    if (!updated) throw new Error("Inventory item not found");
    return updated;
  }

  async deleteInventory(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // Sales Operations
  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  async listSalesBySubsidiary(subsidiaryId: number): Promise<Sale[]> {
    return db.select().from(sales).where(eq(sales.subsidiaryId, subsidiaryId));
  }

  // Activity Log Operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async listActivityLogs(subsidiaryId?: number): Promise<ActivityLog[]> {
    if (subsidiaryId) {
      return db.select().from(activityLogs).where(eq(activityLogs.subsidiaryId, subsidiaryId));
    }
    return db.select().from(activityLogs);
  }
}

export const storage = new DatabaseStorage();