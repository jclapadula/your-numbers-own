import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("transactions")
    .addColumn("csv_row_hash", "text")
    .execute();

  await sql`
    CREATE UNIQUE INDEX idx_transactions_account_csv_hash
    ON transactions("accountId", csv_row_hash)
    WHERE csv_row_hash IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_transactions_account_csv_hash`.execute(db);

  await db.schema
    .alterTable("transactions")
    .dropColumn("csv_row_hash")
    .execute();
}
