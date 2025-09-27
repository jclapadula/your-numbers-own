import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import { endOfMonth } from "date-fns";
import { db } from "../db";
import { getMonthOfYear } from "./utils";
import { budgetsService } from "./budgetsService";
import type { ZonedDate } from "./ZonedDate";
import { toZonedTime } from "date-fns-tz";

export namespace accountBalanceService {
  const getEarliestAffectedMonth = (
    sortedTransactions: { date: ZonedDate }[]
  ) => {
    if (!sortedTransactions.length) return null;

    const earliest = sortedTransactions[0]!.date;

    return getMonthOfYear(earliest);
  };

  const getLatestMonthWithTransactions = async (
    db: Kysely<DB>,
    accountId: string,
    sortedTransactions: { date: ZonedDate }[]
  ) => {
    const latestTransaction =
      (await db
        .selectFrom("transactions")
        .where("accountId", "=", accountId)
        .select(["date"])
        .orderBy("date", "desc")
        .executeTakeFirst()) ||
      sortedTransactions[sortedTransactions.length - 1];

    if (!latestTransaction) return null;

    const latestDate = new Date(latestTransaction.date);
    return { year: latestDate.getFullYear(), month: latestDate.getMonth() + 1 };
  };

  const getPreviousMonthBalance = async (
    db: Kysely<DB>,
    accountId: string,
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

    // Query for previous month's balance
    let previousBalance = 0;
    if (prevYear > 0) {
      const prevBalanceResult = await db
        .selectFrom("account_partial_balances")
        .where("accountId", "=", accountId)
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
    accountId: string,
    start: { year: number; month: number },
    end: { year: number; month: number },
    previousBalance: number
  ) => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    let { year, month } = start;
    const { year: endYear, month: endMonth } = end;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const monthStart = toZonedTime(new Date(year, month - 1, 1), timezone);
      const monthEnd = endOfMonth(monthStart);

      // Sum only the transactions for this month
      const sumResult = await db
        .selectFrom("transactions")
        .where("accountId", "=", accountId)
        .where("date", ">=", monthStart)
        .where("date", "<=", monthEnd)
        .select(db.fn.sum("amount").as("balance"))
        .executeTakeFirst();
      const monthSum = sumResult?.balance ? Number(sumResult.balance) : 0;
      const balance = previousBalance + monthSum;

      await db
        .insertInto("account_partial_balances")
        .values({
          accountId,
          year,
          month,
          balance,
        })
        .onConflict((oc) =>
          oc.columns(["accountId", "year", "month"]).doUpdateSet({ balance })
        )
        .execute();

      previousBalance = balance;

      if (month === 12) {
        month = 1;
        year++;
      } else {
        month++;
      }
    }
  };

  const deleteBalancesAfterLastTransaction = async (
    db: Kysely<DB>,
    accountId: string,
    end: { year: number; month: number }
  ) => {
    await db
      .deleteFrom("account_partial_balances")
      .where("accountId", "=", accountId)
      .where(({ or, eb }) =>
        or([
          eb("year", "=", end.year).and("month", ">", end.month),
          eb("year", ">", end.year),
        ])
      )
      .execute();
  };

  export const updateAccountBalance = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    modifiedTransactions: { date: ZonedDate }[]
  ) => {
    const sortedTransactions = [...modifiedTransactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    if (!sortedTransactions || sortedTransactions.length === 0) return;

    const start = getEarliestAffectedMonth(sortedTransactions);
    if (!start) return;

    const end = await getLatestMonthWithTransactions(
      db,
      accountId,
      sortedTransactions
    );
    // if there is nothing saved, which shouldn't happen, we can't calculate anything
    if (!end) return;

    const previousBalance = await getPreviousMonthBalance(
      db,
      accountId,
      start.year,
      start.month
    );

    await recalculateAndUpsertBalances(
      db,
      budgetId,
      accountId,
      start,
      end,
      previousBalance
    );

    await deleteBalancesAfterLastTransaction(db, accountId, end);
  };

  export const getAccountsBalances = async (accountsIds: string[]) => {
    if (!accountsIds.length) return [];

    return await db
      .selectFrom("account_partial_balances")
      .innerJoin(
        db
          .selectFrom("account_partial_balances")
          .where("accountId", "in", accountsIds)
          .select(["accountId", "year", "month"])
          .orderBy("accountId")
          .orderBy("year", "desc")
          .orderBy("month", "desc")
          .distinctOn("accountId")
          .as("latest"),
        (join) =>
          join
            .onRef(
              "account_partial_balances.accountId",
              "=",
              "latest.accountId"
            )
            .onRef("account_partial_balances.year", "=", "latest.year")
            .onRef("account_partial_balances.month", "=", "latest.month")
      )
      .select([
        "account_partial_balances.accountId",
        "account_partial_balances.balance",
      ])
      .execute();
  };
}
