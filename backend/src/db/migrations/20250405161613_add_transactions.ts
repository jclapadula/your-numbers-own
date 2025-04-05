import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("timeZone", "text", (col) =>
      col.notNull().defaultTo("Europe/Madrid")
    )
    .execute();

  await db.schema
    .createTable("transactions")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("accountId", "uuid", (col) =>
      col.notNull().references("accounts.id")
    )
    .addColumn("date", "timestamp", (col) => col.notNull())
    .addColumn("payeeId", "uuid", (col) => col.references("payees.id"))
    .addColumn("categoryId", "uuid", (col) => col.references("categories.id"))
    .addColumn("notes", "text")
    .addColumn("amount", "bigint", (col) => col.notNull().defaultTo(0))
    .addColumn("isReconciled", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("transactions").execute();

  await db.schema.alterTable("users").dropColumn("timeZone").execute();
}
