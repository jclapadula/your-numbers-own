import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("mfaEnabled", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("mfaSecret", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .dropColumn("mfaEnabled")
    .dropColumn("mfaSecret")
    .execute();
}
