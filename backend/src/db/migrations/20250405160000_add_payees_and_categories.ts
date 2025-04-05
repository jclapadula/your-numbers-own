import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("payees")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("budgetId", "uuid", (col) =>
      col.notNull().references("budget.id")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("payees_budgetId_index")
    .on("payees")
    .column("budgetId")
    .execute();

  await db.schema
    .createTable("categories")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("budgetId", "uuid", (col) =>
      col.notNull().references("budget.id")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("categories_budgetId_index")
    .on("categories")
    .column("budgetId")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("payees_budgetId_index").execute();
  await db.schema.dropTable("payees").execute();

  await db.schema.dropIndex("categories_budgetId_index").execute();
  await db.schema.dropTable("categories").execute();
}
