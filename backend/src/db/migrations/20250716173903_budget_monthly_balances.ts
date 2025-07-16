import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("budget_monthly_balances")
    .addColumn("budgetId", "uuid", (col) =>
      col.notNull().references("budgets.id")
    )
    .addColumn("year", "integer", (col) => col.notNull())
    .addColumn("month", "integer", (col) => col.notNull())
    .addColumn("balance", "bigint", (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createIndex("budget_monthly_balances_budgetId_year_month_index")
    .on("budget_monthly_balances")
    .columns(["budgetId", "year", "month"])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("budget_monthly_balances_budgetId_year_month_index")
    .execute();

  await db.schema.dropTable("budget_monthly_balances").execute();
}
