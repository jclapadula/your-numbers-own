import { Kysely, sql } from "kysely";
import {
  createUpdateTimestampFunction,
  dropUpdateTimestampFunction,
} from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("monthly_category_budgets")
    .addColumn("budgetId", "uuid", (col) =>
      col.notNull().references("budgets.id")
    )
    .addColumn("categoryId", "uuid", (col) =>
      col.references("categories.id").onDelete("cascade")
    )
    .addColumn("year", "integer", (col) => col.notNull())
    .addColumn("month", "integer", (col) => col.notNull())
    .addColumn("assignedAmount", "bigint", (col) => col.notNull())
    .addColumn("balance", "bigint", (col) => col.notNull().defaultTo(0))
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex("monthly_category_budgets_budgetId_categoryId_year_month_idx")
    .on("monthly_category_budgets")
    .columns(["budgetId", "categoryId", "year", "month"])
    .unique()
    .nullsNotDistinct()
    .execute();

  await createUpdateTimestampFunction(db, "monthly_category_budgets");
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropUpdateTimestampFunction(db, "monthly_category_budgets");

  await db.schema
    .dropIndex("monthly_category_budgets_budgetId_categoryId_year_month_idx")
    .execute();

  await db.schema.dropTable("monthly_category_budgets").execute();
}
