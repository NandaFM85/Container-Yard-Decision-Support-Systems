import { pgTable, varchar, integer, boolean, date } from "drizzle-orm/pg-core";

export const containers = pgTable("containers", {
  id: varchar("id", { length: 20 }).primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  size: integer("size").notNull(),
  status: varchar("status", { length: 10 }).notNull(),
  weight: varchar("weight", { length: 10 }).notNull(),
  targetDate: date("target_date").notNull(),
});

export const yardSlots = pgTable("yard_slots", {
  id: varchar("id", { length: 20 }).primaryKey(),
  blockName: varchar("block_name", { length: 5 }).notNull(),
  bayNum: integer("bay_num").notNull(),
  rowNum: integer("row_num").notNull(),
  tierNum: integer("tier_num").notNull(),
  maxTier: integer("max_tier").default(5),
  status: varchar("status", { length: 10 }).default("Kosong"),
  isReeferPlug: boolean("is_reefer_plug").default(false),
  distanceToGate: integer("distance_to_gate").notNull(),
});