import type { ExpressionBuilder } from "kysely";
import type { DB } from "./models";
import type { MonthOfYear } from "../services/models";

export const monthOfYearIs =
  (operator: "=" | "<" | "<=" | ">=" | ">", monthOfYear: MonthOfYear) =>
  ({
    eb,
    refTuple,
  }: ExpressionBuilder<
    DB,
    "budget_monthly_balances" | "monthly_category_budgets"
  >) =>
    eb(
      refTuple("year", "month"),
      operator,
      eb.tuple(monthOfYear.year, monthOfYear.month)
    );

export const categoryIdOrNull =
  (categoryId: string | null) =>
  ({
    eb,
  }: ExpressionBuilder<
    DB,
    "monthly_category_budgets" | "transactions" | "accounts"
  >) =>
    categoryId
      ? eb("categoryId", "=", categoryId)
      : eb("categoryId", "is", null);
