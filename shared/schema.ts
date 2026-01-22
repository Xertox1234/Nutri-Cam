import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scannedItems = pgTable("scanned_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  barcode: text("barcode"),
  productName: text("product_name").notNull(),
  brandName: text("brand_name"),
  servingSize: text("serving_size"),
  calories: decimal("calories", { precision: 10, scale: 2 }),
  protein: decimal("protein", { precision: 10, scale: 2 }),
  carbs: decimal("carbs", { precision: 10, scale: 2 }),
  fat: decimal("fat", { precision: 10, scale: 2 }),
  fiber: decimal("fiber", { precision: 10, scale: 2 }),
  sugar: decimal("sugar", { precision: 10, scale: 2 }),
  sodium: decimal("sodium", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  scannedAt: timestamp("scanned_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  scannedItemId: integer("scanned_item_id").references(() => scannedItems.id, { onDelete: "cascade" }),
  servings: decimal("servings", { precision: 5, scale: 2 }).default("1"),
  mealType: text("meal_type"),
  loggedAt: timestamp("logged_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  scannedItems: many(scannedItems),
  dailyLogs: many(dailyLogs),
}));

export const scannedItemsRelations = relations(scannedItems, ({ one, many }) => ({
  user: one(users, {
    fields: [scannedItems.userId],
    references: [users.id],
  }),
  dailyLogs: many(dailyLogs),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  user: one(users, {
    fields: [dailyLogs.userId],
    references: [users.id],
  }),
  scannedItem: one(scannedItems, {
    fields: [dailyLogs.scannedItemId],
    references: [scannedItems.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScannedItemSchema = createInsertSchema(scannedItems).omit({
  id: true,
  scannedAt: true,
});

export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({
  id: true,
  loggedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertScannedItem = z.infer<typeof insertScannedItemSchema>;
export type ScannedItem = typeof scannedItems.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;

export * from "./models/chat";
