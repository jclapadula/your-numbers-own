import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("account_partial_balances")
    .addColumn("accountId", "uuid", (col) =>
      col.notNull().references("accounts.id")
    )
    .addColumn("year", "integer", (col) => col.notNull())
    .addColumn("month", "integer", (col) => col.notNull())
    .addColumn("balance", "bigint", (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createIndex("account_partial_balances_accountId_year_month_index")
    .on("account_partial_balances")
    .columns(["accountId", "year", "month"])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("account_partial_balances_accountId_year_month_index")
    .execute();
  await db.schema.dropTable("account_partial_balances").execute();
}
