import type { ExpressionBuilder, Kysely } from "kysely";
import { db } from "../db";
import type { DB } from "../db/models";
import type { MonthOfYear } from "./models";
import _, { isEqual, sortBy } from "lodash";
import { getMonthOfYear, getNextMonthOfYear, isBefore } from "./utils";
import { endOfMonth } from "date-fns";
import { categoryIdIs } from "../db/utils";
import type { ZonedDate } from "./ZonedDate";
import { TZDate } from "@date-fns/tz";
import { budgetsService } from "./budgetsService";

export namespace monthlyBudgetService {
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

  const getEarliestAffectedMonthByCategory = (
    modifiedTransactions: {
      date: ZonedDate;
      categories: (string | null)[];
    }[]
  ) =>
    _(modifiedTransactions)
      .map(({ date, ...ids }) => ({
        ...ids,
        monthOfYear: getMonthOfYear(date),
      }))
      .flatMap(({ categories, monthOfYear }) => [
        ...categories.map((category) => ({
          categoryId: category,
          monthOfYear,
        })),
      ])
      .uniqWith(isEqual)
      .groupBy((e) => e.categoryId)
      .map((group) => {
        const sortedGroup = sortBy(
          group,
          (e) => e.monthOfYear.year,
          (e) => e.monthOfYear.month
        );
        const earliestModifiedMonth = sortedGroup[0]!.monthOfYear;

        return {
          categoryId: group[0]!.categoryId,
          earliestModifiedMonth,
        };
      })
      .value();

  const getPreviousMonthBalance = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string | null,
    year: number,
    month: number
  ) => {
    // Calculate previous month and year
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    let previousBalance = 0;
    if (prevYear > 0) {
      const prevBalanceResult = await db
        .selectFrom("monthly_category_budgets")
        .where("budgetId", "=", budgetId)
        .where(categoryIdIs(categoryId))
        .where("year", "=", prevYear)
        .where("month", "=", prevMonth)
        .select(["balance"])
        .executeTakeFirst();
      if (
        prevBalanceResult &&
        prevBalanceResult.balance !== undefined &&
        prevBalanceResult.balance !== null
      ) {
        previousBalance = Number(prevBalanceResult.balance);
      }
    }

    return previousBalance;
  };

  const recalculateAndUpsertBalances = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string | null,
    start: { year: number; month: number },
    previousBalance: number
  ) => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    let { year, month } = start;

    const lastExistingMonth = await db
      .selectFrom("monthly_category_budgets")
      .where("budgetId", "=", budgetId)
      .where(categoryIdIs(categoryId))
      .orderBy("year", "desc")
      .orderBy("month", "desc")
      .select(["year", "month"])
      .executeTakeFirst();

    let lastMonthToUpdate = lastExistingMonth;
    if (!lastMonthToUpdate || isBefore(lastMonthToUpdate, start)) {
      lastMonthToUpdate = start;
    }

    const { year: endYear, month: endMonth } = lastMonthToUpdate;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const monthStart = new TZDate(year, month - 1, 1, timezone);
      const monthEnd = endOfMonth(monthStart);

      // Sum only the transactions for this month
      const query = db
        .selectFrom("transactions")
        .innerJoin("accounts", "transactions.accountId", "accounts.id")
        .where("accounts.budgetId", "=", budgetId)
        .where(categoryIdIs(categoryId))
        .where("date", ">=", monthStart)
        .where("date", "<=", monthEnd)
        .select(db.fn.sum("amount").as("balance"));

      console.log({ query: query.compile() });

      const sumResult = await query.executeTakeFirst();
      const monthSum = sumResult?.balance ? Number(sumResult.balance) : 0;
      console.log({ monthSum });
      const balance = previousBalance + monthSum;

      await db
        .insertInto("monthly_category_budgets")
        .values({
          budgetId,
          categoryId,
          year,
          month,
          balance,
          assignedAmount: 0,
        })
        .onConflict((oc) =>
          oc.columns(["budgetId", "categoryId", "year", "month"]).doUpdateSet({
            balance,
          })
        )
        .execute();

      previousBalance = balance;

      ({ year, month } = getNextMonthOfYear({ year, month }));
    }
  };

  export const updateMonthlyBudgets = async (
    db: Kysely<DB>,
    budgetId: string,
    modifiedTransactions: {
      date: ZonedDate;
      categories: (string | null)[];
    }[]
  ) => {
    console.log({ modifiedTransactions });
    const affectedCategories =
      getEarliestAffectedMonthByCategory(modifiedTransactions);

    for (const category of affectedCategories) {
      const { earliestModifiedMonth, categoryId } = category;

      const previousMonthBalance = await getPreviousMonthBalance(
        db,
        budgetId,
        categoryId,
        earliestModifiedMonth.year,
        earliestModifiedMonth.month
      );

      await recalculateAndUpsertBalances(
        db,
        budgetId,
        categoryId,
        earliestModifiedMonth,
        previousMonthBalance
      );
    }
  };
}
