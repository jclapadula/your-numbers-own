import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("categories")
    .addColumn("isIncome", "boolean", (b) => b.notNull().defaultTo(false))
    .execute();

  await db.schema
    .alterTable("category_groups")
    .addColumn("isIncome", "boolean", (b) => b.notNull().defaultTo(false))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("categories").dropColumn("isIncome").execute();

  await db.schema
    .alterTable("category_groups")
    .dropColumn("isIncome")
    .execute();
}
