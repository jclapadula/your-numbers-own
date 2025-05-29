import type { Kysely } from "kysely";
import { db } from "../db";
import type { DB } from "../db/models";
import type { MonthOfYear } from "./models";
import _, { isEqual, sortBy } from "lodash";
import { getMonthOfYear } from "./utils";

export namespace MonthlyBudgetService {
  const getLatestMonthlyBudgets = async (
    budgetId: string,
    monthOfYear: MonthOfYear
  ) => {
    return await db
      .selectFrom("monthly_category_budgets")
      .innerJoin(
        db
          .selectFrom("monthly_category_budgets")
          .select(["budgetId", "categoryId", "year", "month"])
          .where(({ or, eb }) =>
            or([
              eb("year", "=", monthOfYear.year).and(
                "month",
                "<=",
                monthOfYear.month
              ),
              eb("year", "<", monthOfYear.year),
            ])
          )
          .orderBy("categoryId")
          .orderBy("year", "desc")
          .orderBy("month", "desc")
          .distinctOn("categoryId")
          .as("latest"),
        (join) =>
          join
            .onRef("monthly_category_budgets.budgetId", "=", "latest.budgetId")
            .onRef(
              "monthly_category_budgets.categoryId",
              "=",
              "latest.categoryId"
            )
            .onRef("monthly_category_budgets.year", "=", "latest.year")
            .onRef("monthly_category_budgets.month", "=", "latest.month")
      )
      .select([
        "latest.categoryId",
        "monthly_category_budgets.year",
        "monthly_category_budgets.month",
        "monthly_category_budgets.assignedAmount",
        "monthly_category_budgets.balance",
      ])
      .where("monthly_category_budgets.budgetId", "=", budgetId)
      .execute();
  };

  export const getMonthlyBudget = async (
    budgetId: string,
    monthOfYear: MonthOfYear
  ) => {
    const categories = await db
      .selectFrom("categories")
      .where("budgetId", "=", budgetId)
      .selectAll()
      .execute();

    const latestMonthlyBudgets = await getLatestMonthlyBudgets(
      budgetId,
      monthOfYear
    );

    const monthCategories = categories.map((category) => {
      const latestMonthlyBudget = latestMonthlyBudgets.find(
        (latestMonthlyBudget) => latestMonthlyBudget.categoryId === category.id
      );

      return {
        categoryId: category.id,
        categoryName: category.name,
        assignedAmount: latestMonthlyBudget?.assignedAmount ?? 0,
        balance: latestMonthlyBudget?.balance ?? 0,
      };
    });
  };

  export const updateMonthlyBudget = async (
    db: Kysely<DB>,
    budgetId: string,
    modifiedTransactions: {
      date: Date;
      categoryId: string | null;
      oldCategoryId: string | null;
    }[]
  ) => {
    const allAffectedCategories = _(modifiedTransactions)
      .map(({ date, ...ids }) => ({
        ...ids,
        monthOfYear: getMonthOfYear(date),
      }))
      .flatMap(({ categoryId, oldCategoryId, monthOfYear }) => [
        { categoryId, monthOfYear },
        { categoryId: oldCategoryId, monthOfYear },
      ])
      .uniqWith(isEqual)
      .groupBy((e) => e.categoryId)
      .map((group) => {
        const sortedGroup = sortBy(
          group,
          (e) => e.monthOfYear.year,
          (e) => e.monthOfYear.month
        );
        const earliestMonthOfYear = sortedGroup[0]!.monthOfYear;
        const latestMonthOfYear =
          sortedGroup[sortedGroup.length - 1]!.monthOfYear;

        return {
          categoryId: group[0]!.categoryId,
          earliestMonthOfYear,
          latestMonthOfYear,
        };
      });
  };
}
