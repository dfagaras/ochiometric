import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  day: text("day").notNull(),
  score: real("score").notNull(),
  createdAt: text("created_at").notNull(),
});
