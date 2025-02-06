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
import { db, isPostgres, isMysql, sql } from "./db";
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

  private async executeQuery<T>(operation: () => Promise<T>): Promise<T> {
    try {
      if (!db) {
        throw new Error('Database connection not initialized');
      }
      return await operation();
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.executeQuery(async () => {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.executeQuery(async () => {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.executeQuery(async () => {
      if (isPostgres(db)) {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser;
      } else {
        const result = await db.insert(users).values(user);
        const [createdUser] = await db.select().from(users).where(eq(users.id, result[0].insertId));
        return createdUser;
      }
    });
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    return this.executeQuery(async () => {
      if (isPostgres(db)) {
        const [updated] = await db
          .update(users)
          .set(user)
          .where(eq(users.id, id))
          .returning();
        if (!updated) throw new Error("User not found");
        return updated;
      } else {
        await db.update(users).set(user).where(eq(users.id, id));
        const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
        if (!updatedUser) throw new Error("User not found");
        return updatedUser;
      }
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.executeQuery(async () => {
      await db.delete(users).where(eq(users.id, id));
    });
  }

  async getSubsidiary(id: number): Promise<Subsidiary | undefined> {
    return this.executeQuery(async () => {
      const result = await db.select().from(subsidiaries).where(eq(subsidiaries.id, id));
      return result[0];
    });
  }

  async listSubsidiaries(): Promise<Subsidiary[]> {
    return this.executeQuery(async () => {
      return db.select().from(subsidiaries);
    });
  }

  async createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary> {
    return this.executeQuery(async () => {
      if (!subsidiary.name || !subsidiary.taxId || !subsidiary.email || !subsidiary.phoneNumber) {
        throw new Error('Missing required fields');
      }
      if (isPostgres(db)) {
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
      } else {
        const result = await db.insert(subsidiaries).values({
          name: subsidiary.name,
          taxId: subsidiary.taxId,
          email: subsidiary.email,
          phoneNumber: subsidiary.phoneNumber,
          address: subsidiary.address,
          city: subsidiary.city,
          country: subsidiary.country,
          status: subsidiary.status ?? true,
        });
        const [createdSubsidiary] = await db.select().from(subsidiaries).where(eq(subsidiaries.id, result[0].insertId));
        return createdSubsidiary;
      }
    });
  }

  async updateSubsidiary(id: number, subsidiary: Partial<InsertSubsidiary>): Promise<Subsidiary> {
    return this.executeQuery(async () => {
      if (isPostgres(db)) {
        const [updated] = await db
          .update(subsidiaries)
          .set(subsidiary)
          .where(eq(subsidiaries.id, id))
          .returning();
        if (!updated) throw new Error("Subsidiary not found");
        return updated;
      } else {
        await db.update(subsidiaries).set(subsidiary).where(eq(subsidiaries.id, id));
        const [updatedSubsidiary] = await db.select().from(subsidiaries).where(eq(subsidiaries.id, id));
        if (!updatedSubsidiary) throw new Error("Subsidiary not found");
        return updatedSubsidiary;
      }
    });
  }

  async getInventory(id: number): Promise<Inventory | undefined> {
    return this.executeQuery(async () => {
      const result = await db.select().from(inventory).where(eq(inventory.id, id));
      return result[0];
    });
  }

  async listInventoryBySubsidiary(subsidiaryId: number): Promise<Inventory[]> {
    return this.executeQuery(async () => {
      return db.select().from(inventory).where(eq(inventory.subsidiaryId, subsidiaryId));
    });
  }

  async createInventory(item: InsertInventory): Promise<Inventory> {
    return this.executeQuery(async () => {
      if (isPostgres(db)) {
        const [newItem] = await db.insert(inventory).values(item).returning();
        return newItem;
      } else {
        const result = await db.insert(inventory).values(item);
        const [createdItem] = await db.select().from(inventory).where(eq(inventory.id, result[0].insertId));
        return createdItem;
      }
    });
  }

  async updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory> {
    return this.executeQuery(async () => {
      if (isPostgres(db)) {
        const [updated] = await db
          .update(inventory)
          .set(item)
          .where(eq(inventory.id, id))
          .returning();
        if (!updated) throw new Error("Inventory item not found");
        return updated;
      } else {
        await db.update(inventory).set(item).where(eq(inventory.id, id));
        const [updatedItem] = await db.select().from(inventory).where(eq(inventory.id, id));
        if (!updatedItem) throw new Error("Inventory item not found");
        return updatedItem;
      }
    });
  }

  async deleteInventory(id: number): Promise<void> {
    return this.executeQuery(async () => {
      await db.delete(inventory).where(eq(inventory.id, id));
    });
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    return this.executeQuery(async () => {
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
    });
  }

  async listSalesBySubsidiary(subsidiaryId: number): Promise<Sale[]> {
    return this.executeQuery(async () => {
      return db.select().from(sales).where(eq(sales.subsidiaryId, subsidiaryId));
    });
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    return this.executeQuery(async () => {
      if (isPostgres(db)) {
        const [newLog] = await db.insert(activityLogs).values(log).returning();
        return newLog;
      } else {
        const result = await db.insert(activityLogs).values(log);
        const [createdLog] = await db.select().from(activityLogs).where(eq(activityLogs.id, result[0].insertId));
        return createdLog;
      }
    });
  }

  async listActivityLogs(subsidiaryId?: number): Promise<ActivityLog[]> {
    return this.executeQuery(async () => {
      if (subsidiaryId) {
        return db.select().from(activityLogs).where(eq(activityLogs.subsidiaryId, subsidiaryId));
      }
      return db.select().from(activityLogs);
    });
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
    return this.executeQuery(async () => {
      return db.select().from(users).where(eq(users.subsidiaryId, subsidiaryId));
    });
  }
  async listUsers(): Promise<User[]> {
    return this.executeQuery(async () => {
      return db.select().from(users);
    });
  }
}

export const storage = new DatabaseStorage();

setTimeout(() => {
  storage.ensureDefaultAdmin().catch(console.error);
}, 2000);