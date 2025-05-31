import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("budgets")
    .addColumn("timezone", "text", (col) =>
      col.notNull().defaultTo("Europe/Berlin")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("budgets").dropColumn("timezone").execute();
}
