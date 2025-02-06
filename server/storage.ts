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
import { loadDbConfig } from "./config";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const config = loadDbConfig();

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getSubsidiary(id: number): Promise<Subsidiary | undefined>;
  listSubsidiaries(): Promise<Subsidiary[]>;
  createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary>;
  updateSubsidiary(id: number, subsidiary: Partial<InsertSubsidiary>): Promise<Subsidiary>;
  getInventory(id: number): Promise<Inventory | undefined>;
  listInventoryBySubsidiary(subsidiaryId: number): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, inventory: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventory(id: number): Promise<void>;
  createSale(sale: InsertSale): Promise<Sale>;
  listSalesBySubsidiary(subsidiaryId: number): Promise<Sale[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listActivityLogs(subsidiaryId?: number): Promise<ActivityLog[]>;
  sessionStore: session.Store;
  ensureDefaultAdmin(): Promise<void>;
  listUsersBySubsidiary(subsidiaryId: number): Promise<User[]>;
  listUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (config.engine === 'postgresql' && process.env.DATABASE_URL) {
      const PostgresStore = connectPg(session);
      this.sessionStore = new PostgresStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    try {
      const [updated] = await db
        .update(users)
        .set(user)
        .where(eq(users.id, id))
        .returning();
      if (!updated) throw new Error("User not found");
      return updated;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getSubsidiary(id: number): Promise<Subsidiary | undefined> {
    try {
      const [subsidiary] = await db.select().from(subsidiaries).where(eq(subsidiaries.id, id));
      return subsidiary;
    } catch (error) {
      console.error('Error getting subsidiary:', error);
      throw error;
    }
  }

  async listSubsidiaries(): Promise<Subsidiary[]> {
    try {
      return db.select().from(subsidiaries);
    } catch (error) {
      console.error('Error listing subsidiaries:', error);
      throw error;
    }
  }

  async createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary> {
    try {
      if (!subsidiary.name || !subsidiary.taxId || !subsidiary.email || !subsidiary.phoneNumber) {
        throw new Error('Missing required fields');
      }

      const [newSubsidiary] = await db
        .insert(subsidiaries)
        .values({
          name: subsidiary.name,
          taxId: subsidiary.taxId,
          email: subsidiary.email,
          phoneNumber: subsidiary.phoneNumber,
          address: subsidiary.address,
          city: subsidiary.city,
          country: subsidiary.country,
          status: subsidiary.status ?? true,
        })
        .returning();

      return newSubsidiary;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Tax ID already exists');
      }
      console.error('Error creating subsidiary:', error);
      throw error;
    }
  }

  async updateSubsidiary(id: number, subsidiary: Partial<InsertSubsidiary>): Promise<Subsidiary> {
    try {
      const [updated] = await db
        .update(subsidiaries)
        .set(subsidiary)
        .where(eq(subsidiaries.id, id))
        .returning();
      if (!updated) throw new Error("Subsidiary not found");
      return updated;
    } catch (error) {
      console.error('Error updating subsidiary:', error);
      throw error;
    }
  }

  async getInventory(id: number): Promise<Inventory | undefined> {
    try {
      const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
      return item;
    } catch (error) {
      console.error('Error getting inventory item:', error);
      throw error;
    }
  }

  async listInventoryBySubsidiary(subsidiaryId: number): Promise<Inventory[]> {
    try {
      return db.select().from(inventory).where(eq(inventory.subsidiaryId, subsidiaryId));
    } catch (error) {
      console.error('Error listing inventory by subsidiary:', error);
      throw error;
    }
  }

  async createInventory(item: InsertInventory): Promise<Inventory> {
    try {
      const [newItem] = await db.insert(inventory).values(item).returning();
      return newItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory> {
    try {
      const [updated] = await db
        .update(inventory)
        .set(item)
        .where(eq(inventory.id, id))
        .returning();
      if (!updated) throw new Error("Inventory item not found");
      return updated;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  async deleteInventory(id: number): Promise<void> {
    try {
      await db.delete(inventory).where(eq(inventory.id, id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    try {
      const [inventoryItem] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.id, sale.itemId));

      if (!inventoryItem) {
        throw new Error("Inventory item not found");
      }

      if (inventoryItem.quantity < sale.quantity) {
        throw new Error("Insufficient stock");
      }

      const [newSale] = await db.transaction(async (tx) => {
        const [createdSale] = await tx
          .insert(sales)
          .values({
            ...sale,
            timestamp: sale.timestamp ? new Date(sale.timestamp) : new Date(),
          })
          .returning();

        await tx
          .update(inventory)
          .set({
            quantity: inventoryItem.quantity - sale.quantity,
          })
          .where(eq(inventory.id, sale.itemId));

        return [createdSale];
      });

      return newSale;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  async listSalesBySubsidiary(subsidiaryId: number): Promise<Sale[]> {
    try {
      return db.select().from(sales).where(eq(sales.subsidiaryId, subsidiaryId));
    } catch (error) {
      console.error('Error listing sales by subsidiary:', error);
      throw error;
    }
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      const [newLog] = await db.insert(activityLogs).values(log).returning();
      return newLog;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  async listActivityLogs(subsidiaryId?: number): Promise<ActivityLog[]> {
    try {
      if (subsidiaryId) {
        return db.select().from(activityLogs).where(eq(activityLogs.subsidiaryId, subsidiaryId));
      }
      return db.select().from(activityLogs);
    } catch (error) {
      console.error('Error listing activity logs:', error);
      throw error;
    }
  }
  async ensureDefaultAdmin(): Promise<void> {
    try {
      const adminUser = await this.getUserByUsername("admin");
      if (!adminUser) {
        await this.createUser({
          username: "admin",
          password: await hashPassword("admin123"),
          role: "mhc_admin",
          subsidiaryId: null,
        });
        console.log('Default admin user created successfully');
      }
    } catch (error) {
      console.error('Error ensuring default admin:', error);
      throw error;
    }
  }
  async listUsersBySubsidiary(subsidiaryId: number): Promise<User[]> {
    try {
      return db.select().from(users).where(eq(users.subsidiaryId, subsidiaryId));
    } catch (error) {
      console.error('Error listing users by subsidiary:', error);
      throw error;
    }
  }
  async listUsers(): Promise<User[]> {
    try {
      return db.select().from(users);
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

setTimeout(() => {
  storage.ensureDefaultAdmin().catch(console.error);
}, 1000);