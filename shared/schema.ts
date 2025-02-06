import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["mhc_admin", "subsidiary_admin", "staff"] }).notNull(),
  subsidiaryId: integer("subsidiary_id").references(() => subsidiaries.id),
});

// Subsidiary Companies
export const subsidiaries = pgTable("subsidiaries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  taxId: text("tax_id").notNull().unique(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  logo: text("logo"), // Will store the path/id of the uploaded file
  address: text("address"),
  city: text("city"),
  country: text("country"),
  status: boolean("status").notNull().default(true),
});

// Inventory Items
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  subsidiaryId: integer("subsidiary_id").notNull().references(() => subsidiaries.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  costPrice: doublePrecision("cost_price").notNull(),
  salePrice: doublePrecision("sale_price").notNull(),
  quantity: integer("quantity").notNull(),
});

// Sales Records
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  subsidiaryId: integer("subsidiary_id").notNull().references(() => subsidiaries.id),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => inventory.id),
  quantity: integer("quantity").notNull(),
  salePrice: doublePrecision("sale_price").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  subsidiaryId: integer("subsidiary_id").references(() => subsidiaries.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert Schemas with validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  subsidiaryId: true,
});

export const insertSubsidiarySchema = createInsertSchema(subsidiaries)
  .extend({
    email: z.string().email("Invalid email format"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })
  .omit({ logo: true }); // Logo will be handled separately through file upload

export const insertInventorySchema = createInsertSchema(inventory);
export const insertSaleSchema = createInsertSchema(sales);
export const insertActivityLogSchema = createInsertSchema(activityLogs);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subsidiary = typeof subsidiaries.$inferSelect;
export type InsertSubsidiary = z.infer<typeof insertSubsidiarySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;