import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("accounts")
    .addColumn("csv_import_config", "jsonb")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("accounts")
    .dropColumn("csv_import_config")
    .execute();
}
