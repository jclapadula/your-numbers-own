import { pgTable, varchar, uuid, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
});
