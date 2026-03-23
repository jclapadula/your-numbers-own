import { type Kysely, type SqlBool, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("idx_transactions_account_csv_hash")
    .ifExists()
    .execute();

  await db.schema
    .alterTable("transactions")
    .renameColumn("csv_row_hash", "import_hash")
    .execute();

  await db.schema
    .createIndex("idx_transactions_account_import_hash")
    .unique()
    .on("transactions")
    .columns(["accountId", "import_hash"])
    .where(sql<SqlBool>`import_hash IS NOT NULL`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("idx_transactions_account_import_hash")
    .ifExists()
    .execute();

  await db.schema
    .alterTable("transactions")
    .renameColumn("import_hash", "csv_row_hash")
    .execute();

  await db.schema
    .createIndex("idx_transactions_account_csv_hash")
    .unique()
    .on("transactions")
    .columns(["accountId", "csv_row_hash"])
    .where(sql<SqlBool>`csv_row_hash IS NOT NULL`)
    .execute();
}
