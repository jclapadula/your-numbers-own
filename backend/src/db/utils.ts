import type { ExpressionBuilder } from "kysely";
import type { DB } from "./models";

export const categoryIdIs =
  (categoryId: string | null) =>
  ({
    eb,
  }: {
    eb: ExpressionBuilder<
      DB,
      "monthly_category_budgets" | "transactions" | "accounts"
    >;
  }) =>
    categoryId
      ? eb("categoryId", "=", categoryId)
      : eb("categoryId", "is", null);
