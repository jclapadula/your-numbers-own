import { Kysely, sql } from "kysely";
import type { DB } from "../models";

export async function up(db: Kysely<DB>): Promise<void> {
  await db.schema
    .createTable("category_groups")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("budgetId", "uuid", (col) =>
      col.references("budgets.id").notNull()
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("position", "smallint", (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createIndex("category_groups_budgetId_idx")
    .on("category_groups")
    .column("budgetId")
    .execute();

  await db.schema
    .alterTable("categories")
    .addColumn("groupId", "uuid", (col) =>
      col.references("category_groups.id").notNull()
    )
    .addColumn("position", "smallint", (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
  await db.schema.dropIndex("category_groups_budgetId_idx").execute();

  await db.schema
    .alterTable("categories")
    .dropColumn("groupId")
    .dropColumn("position")
    .execute();

  await db.schema.dropTable("category_groups").execute();
}
