import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("account_partial_balances")
    .addColumn("reconciledBalance", "bigint", (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("account_partial_balances")
    .dropColumn("reconciledBalance")
    .execute();
}
