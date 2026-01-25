import { db } from "../db";
import type { MonthlyBudget, MonthOfYear } from "./models";
import _ from "lodash";
import { monthOfYearIs } from "../db/utils";

export namespace monthlyBudgetService {
  const getLatestMonthlySpendBudgets = async (
    budgetId: string,
    monthOfYear: MonthOfYear,
  ) => {
    const query = db
      .selectFrom((query) =>
        query
          .selectFrom("monthly_category_budgets")
          .select([
            "budgetId",
            "categoryId",
            "year",
            "month",
            "assignedAmount",
            "balance",
          ])
          .where(({ eb, refTuple }) =>
            eb(
              refTuple("year", "month"),
              "<=",
              eb.tuple(monthOfYear.year, monthOfYear.month),
            ),
          )
          .where("budgetId", "=", budgetId)
          .orderBy("categoryId")
          .orderBy("year", "desc")
          .orderBy("month", "desc")
          .distinctOn("categoryId")
          .as("latest"),
      )
      .leftJoinLateral(
        ({ eb, ref }) =>
          eb
            .selectFrom("monthly_category_budgets")
            .select(["balance"])
            .where("categoryId", "=", ref("latest.categoryId"))
            .where(({ eb, refTuple }) =>
              eb(
                refTuple("year", "month"),
                "<",
                eb.tuple(monthOfYear.year, monthOfYear.month),
              ),
            )
            .orderBy("year", "desc")
            .orderBy("month", "desc")
            .limit(1)
            .as("previous_balance"),
        (join) => join.onTrue(),
      )
      .select([
        "latest.categoryId",
        "latest.year",
        "latest.month",
        "latest.assignedAmount",
        "latest.balance",
        "previous_balance.balance as previousBalance",
      ]);

    return await query.execute();
  };

  const getIncomeBalancesForMonth = async (
    budgetId: string,
    monthOfYear: MonthOfYear,
  ) => {
    return await db
      .selectFrom("monthly_category_budgets")
      .select([
        "monthly_category_budgets.categoryId",
        "monthly_category_budgets.balance",
      ])
      .innerJoin(
        "categories",
        "monthly_category_budgets.categoryId",
        "categories.id",
      )
      .where("monthly_category_budgets.budgetId", "=", budgetId)
      .where("categories.isIncome", "=", true)
      .where(({ eb, refTuple }) =>
        eb(
          refTuple("year", "month"),
          "=",
          eb.tuple(monthOfYear.year, monthOfYear.month),
        ),
      )
      .execute();
  };

  export const getMonthlyBudget = async (
    budgetId: string,
    monthOfYear: MonthOfYear,
  ) => {
    const categories = await db
      .selectFrom("categories")
      .where("budgetId", "=", budgetId)
      .selectAll()
      .execute();

    const latestMonthlySpendBudgets = await getLatestMonthlySpendBudgets(
      budgetId,
      monthOfYear,
    );

    const currentMonthIncomeBalances = await getIncomeBalancesForMonth(
      budgetId,
      monthOfYear,
    );

    const lastMonthCarryOver = await db
      .selectFrom("budget_monthly_balances")
      .where("budgetId", "=", budgetId)
      .where(monthOfYearIs("<", monthOfYear))
      .select("balance")
      .orderBy("year", "desc")
      .orderBy("month", "desc")
      .executeTakeFirst();

    const spendCategories = categories
      .filter((category) => !category.isIncome)
      .map((category) => {
        const latestMonthlyBudget = latestMonthlySpendBudgets.find(
          (latestMonthlyBudget) =>
            latestMonthlyBudget.categoryId === category.id,
        );

        const previousBalance = latestMonthlyBudget?.previousBalance ?? 0;
        const assignedAmount =
          latestMonthlyBudget?.year === monthOfYear.year &&
          latestMonthlyBudget?.month === monthOfYear.month
            ? latestMonthlyBudget?.assignedAmount
            : 0;
        const balance = latestMonthlyBudget?.balance ?? 0;

        const spent = balance - assignedAmount - previousBalance;

        return {
          categoryId: category.id,
          categoryName: category.name,
          isIncome: category.isIncome,
          assignedAmount,
          balance,
          previousBalance,
          spent,
        };
      });

    const incomeCategories = categories
      .filter((category) => category.isIncome)
      .map((category) => {
        const monthBalance = currentMonthIncomeBalances.find(
          (latestMonthlyBudget) =>
            latestMonthlyBudget.categoryId === category.id,
        );

        const balance = monthBalance?.balance ?? 0;

        return {
          categoryId: category.id,
          categoryName: category.name,
          balance,
        };
      });

    return {
      spendCategories,
      incomeCategories,
      monthOfYear,
      lastMonthCarryOver: lastMonthCarryOver?.balance ?? 0,
    } satisfies MonthlyBudget;
  };
}
