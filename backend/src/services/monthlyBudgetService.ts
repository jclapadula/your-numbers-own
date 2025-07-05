import { type Kysely } from "kysely";
import { db } from "../db";
import type { DB } from "../db/models";
import type { MonthlyBudget, MonthOfYear } from "./models";
import _, { isEqual, sortBy } from "lodash";
import { getMonthOfYear, getNextMonthOfYear, isBefore } from "./utils";
import { endOfMonth } from "date-fns";
import { categoryIdOrNull } from "../db/utils";
import type { ZonedDate } from "./ZonedDate";
import { TZDate } from "@date-fns/tz";
import { budgetsService } from "./budgetsService";

export namespace monthlyBudgetService {
  const getLatestMonthlyBudgets = async (
    budgetId: string,
    monthOfYear: MonthOfYear
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
              eb.tuple(monthOfYear.year, monthOfYear.month)
            )
          )
          .where("budgetId", "=", budgetId)
          .orderBy("categoryId")
          .orderBy("year", "desc")
          .orderBy("month", "desc")
          .distinctOn("categoryId")
          .as("latest")
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
                eb.tuple(monthOfYear.year, monthOfYear.month)
              )
            )
            .orderBy("year", "desc")
            .orderBy("month", "desc")
            .limit(1)
            .as("previous_balance"),
        (join) => join.onTrue()
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

  export const getMonthlyBudget = async (
    budgetId: string,
    monthOfYear: MonthOfYear
  ) => {
    const categories = await db
      .selectFrom("categories")
      .where("budgetId", "=", budgetId)
      .selectAll()
      .execute();
    categories.push({
      id: null as any,
      name: "Available Budget",
      budgetId,
      position: -1,
      groupId: null as any,
    });

    const latestMonthlyBudgets = await getLatestMonthlyBudgets(
      budgetId,
      monthOfYear
    );

    const monthCategories = categories.map((category) => {
      const latestMonthlyBudget = latestMonthlyBudgets.find(
        (latestMonthlyBudget) => latestMonthlyBudget.categoryId === category.id
      );

      const assignedAmount =
        latestMonthlyBudget?.year === monthOfYear.year &&
        latestMonthlyBudget?.month === monthOfYear.month
          ? latestMonthlyBudget?.assignedAmount
          : 0;
      const balance = latestMonthlyBudget?.balance ?? 0;
      const previousBalance = latestMonthlyBudget?.previousBalance ?? 0;
      const spent = balance - assignedAmount - previousBalance;

      return {
        categoryId: category.id,
        categoryName: category.name,
        assignedAmount,
        balance,
        previousBalance,
        spent,
      };
    });

    return {
      monthCategories,
      monthOfYear,
    } satisfies MonthlyBudget;
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

  const recalculateAndUpsertBalances = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string | null,
    start: { year: number; month: number },
    previousBalance: number
  ) => {
    console.log({ start, previousBalance });
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
      const monthStart = new TZDate(year, month - 1, 1, timezone);
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
    const affectedCategories =
      getEarliestAffectedMonthByCategory(modifiedTransactions);

    for (const category of affectedCategories) {
      const { earliestModifiedMonth, categoryId } = category;

      const previousBalance = await getPreviousBalance(
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
        previousBalance
      );
    }
  };
}
