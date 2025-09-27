import { type Kysely } from "kysely";
import type { DB } from "../db/models";
import _, { isEqual, sortBy } from "lodash";
import { getMonthOfYear, getNextMonthOfYear, isBefore } from "./utils";
import { endOfMonth } from "date-fns";
import { categoryIdOrNull, monthOfYearIs } from "../db/utils";
import type { ZonedDate } from "./ZonedDate";
import { budgetsService } from "./budgetsService";
import { categoriesService } from "./categoriesService";
import { toZonedTime } from "date-fns-tz";

export namespace balanceUpdater {
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

  const getPreviousBalance = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string | null,
    year: number,
    month: number
  ) => {
    const prevBalanceResult = await db
      .selectFrom("monthly_category_budgets")
      .where("budgetId", "=", budgetId)
      .where(categoryIdOrNull(categoryId))
      .where(({ eb, tuple, refTuple }) =>
        eb(refTuple("year", "month"), "<", tuple(year, month))
      )
      .orderBy("year", "desc")
      .orderBy("month", "desc")
      .select(["balance"])
      .executeTakeFirst();

    return prevBalanceResult?.balance ? Number(prevBalanceResult.balance) : 0;
  };

  const recalculateCategoryBalances = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string | null,
    start: { year: number; month: number },
    isIncomeCategory: boolean
  ) => {
    let previousBalance = isIncomeCategory
      ? 0
      : await getPreviousBalance(
          db,
          budgetId,
          categoryId,
          start.year,
          start.month
        );

    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    const lastExistingMonth = await db
      .selectFrom("monthly_category_budgets")
      .where("budgetId", "=", budgetId)
      .where(categoryIdOrNull(categoryId))
      .orderBy("year", "desc")
      .orderBy("month", "desc")
      .select(["year", "month"])
      .executeTakeFirst();
    let lastMonthToUpdate = lastExistingMonth;

    if (!lastMonthToUpdate || isBefore(lastMonthToUpdate, start)) {
      lastMonthToUpdate = start;
    }

    const { year: endYear, month: endMonth } = lastMonthToUpdate;

    let { year, month } = start;
    while (year < endYear || (year === endYear && month <= endMonth)) {
      const monthStart = toZonedTime(new Date(year, month - 1, 1), timezone);
      const monthEnd = endOfMonth(monthStart);

      const spentOnMonthResult = await db
        .selectFrom("transactions")
        .innerJoin("accounts", "transactions.accountId", "accounts.id")
        .where("accounts.budgetId", "=", budgetId)
        .where(categoryIdOrNull(categoryId))
        .where("date", ">=", monthStart)
        .where("date", "<=", monthEnd)
        .select(db.fn.sum("amount").as("amount"))
        .executeTakeFirst();
      const spent = spentOnMonthResult?.amount
        ? Number(spentOnMonthResult.amount)
        : 0;

      const assignedResult = await db
        .selectFrom("monthly_category_budgets")
        .select(db.fn.sum("assignedAmount").as("assignedAmount"))
        .where("budgetId", "=", budgetId)
        .where(categoryIdOrNull(categoryId))
        .where("year", "=", year)
        .where("month", "=", month)
        .executeTakeFirst();
      const assigned = assignedResult?.assignedAmount
        ? Number(assignedResult.assignedAmount)
        : 0;

      const balance = previousBalance + spent + assigned;

      await db
        .insertInto("monthly_category_budgets")
        .values({
          budgetId,
          categoryId,
          year,
          month,
          balance,
          assignedAmount: assigned,
        })
        .onConflict((oc) =>
          oc.columns(["budgetId", "categoryId", "year", "month"]).doUpdateSet({
            balance,
          })
        )
        .execute();

      previousBalance = isIncomeCategory ? 0 : balance;

      ({ year, month } = getNextMonthOfYear({ year, month }));
    }
  };

  const updateBudgetMonthlyBalances = async (
    db: Kysely<DB>,
    budgetId: string,
    start: { year: number; month: number }
  ) => {
    let { balance: previousBalance = 0 } =
      (await db
        .selectFrom("budget_monthly_balances")
        .select("balance")
        .where(monthOfYearIs("<", start))
        .orderBy("year", "desc")
        .orderBy("month", "desc")
        .executeTakeFirst()) || {};

    const lastExistingMonth = await db
      .selectFrom("monthly_category_budgets")
      .where("budgetId", "=", budgetId)
      .orderBy("year", "desc")
      .orderBy("month", "desc")
      .select(["year", "month"])
      .executeTakeFirst();
    let lastMonthToUpdate = lastExistingMonth;

    if (!lastMonthToUpdate || isBefore(lastMonthToUpdate, start)) {
      lastMonthToUpdate = start;
    }

    const { year: endYear, month: endMonth } = lastMonthToUpdate;
    let { year, month } = start;
    while (year < endYear || (year === endYear && month <= endMonth)) {
      const monthlyBudgetsForMonth = await db
        .selectFrom("monthly_category_budgets")
        .innerJoin(
          "categories",
          "monthly_category_budgets.categoryId",
          "categories.id"
        )
        .where("monthly_category_budgets.budgetId", "=", budgetId)
        .where("year", "=", year)
        .where("month", "=", month)
        .select(["categoryId", "assignedAmount", "balance", "isIncome"])
        .execute();

      const totalIncome = monthlyBudgetsForMonth
        .filter(({ isIncome }) => isIncome)
        .reduce((acc, { balance }) => acc + balance, 0);
      const totalAssigned = monthlyBudgetsForMonth
        .filter(({ isIncome }) => !isIncome)
        .reduce((acc, { assignedAmount }) => acc + assignedAmount, 0);

      const balance = previousBalance + totalIncome - totalAssigned;

      await db
        .insertInto("budget_monthly_balances")
        .values({
          budgetId,
          year,
          month,
          balance,
        })
        .onConflict((oc) =>
          oc.columns(["budgetId", "year", "month"]).doUpdateSet({
            balance,
          })
        )
        .execute();

      previousBalance = balance;

      ({ year, month } = getNextMonthOfYear({ year, month }));
    }
  };

  export const updateMonthlyBalances = async (
    db: Kysely<DB>,
    budgetId: string,
    modifiedTransactions: {
      date: ZonedDate;
      categories: (string | null)[];
    }[]
  ) => {
    const affectedCategories =
      getEarliestAffectedMonthByCategory(modifiedTransactions);

    for (const category of affectedCategories) {
      const { earliestModifiedMonth, categoryId } = category;

      const isIncomeCategory = await categoriesService.isIncomeCategory(
        db,
        budgetId,
        categoryId
      );

      await recalculateCategoryBalances(
        db,
        budgetId,
        categoryId,
        earliestModifiedMonth,
        isIncomeCategory
      );
    }

    const { earliestModifiedMonth } = affectedCategories[0] || {};
    if (!earliestModifiedMonth) return;

    await updateBudgetMonthlyBalances(db, budgetId, earliestModifiedMonth);
  };
}
