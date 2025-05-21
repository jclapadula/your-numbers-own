import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import { endOfMonth } from "date-fns";

export namespace AccountBalanceService {
  const getEarliestAffectedMonth = (sortedTransactions: { date: Date }[]) => {
    if (!sortedTransactions.length) return null;

    const earliest = sortedTransactions[0]!.date;

    return {
      year: earliest.getFullYear(),
      month: earliest.getMonth() + 1,
    };
  };

  const getLatestMonthWithTransactions = async (
    db: Kysely<DB>,
    accountId: string
  ) => {
    const latestTransaction = await db
      .selectFrom("transactions")
      .where("accountId", "=", accountId)
      .select(["date"])
      .orderBy("date", "desc")
      .limit(1)
      .executeTakeFirst();
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
    let previousBalance = 0n;
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
        previousBalance = BigInt(prevBalanceResult.balance);
      }
    }

    return previousBalance;
  };

  const recalculateAndUpsertBalances = async (
    db: Kysely<DB>,
    accountId: string,
    start: { year: number; month: number },
    end: { year: number; month: number },
    previousBalance: bigint
  ) => {
    let { year, month } = start;
    const { year: endYear, month: endMonth } = end;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = endOfMonth(monthStart);

      // Sum only the transactions for this month
      const sumResult = await db
        .selectFrom("transactions")
        .where("accountId", "=", accountId)
        .where("date", ">=", monthStart)
        .where("date", "<=", monthEnd)
        .select(db.fn.sum("amount").as("balance"))
        .executeTakeFirst();
      const monthSum = sumResult?.balance ? BigInt(sumResult.balance) : 0n;
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

  export const updateAccountBalance = async (
    db: Kysely<DB>,
    accountId: string,
    modifiedTransactions: { date: Date; amount: number }[]
  ) => {
    const sortedTransactions = [...modifiedTransactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    if (!sortedTransactions || sortedTransactions.length === 0) return;

    const start = getEarliestAffectedMonth(sortedTransactions);
    if (!start) return;

    const end = await getLatestMonthWithTransactions(db, accountId);
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
      accountId,
      start,
      end,
      previousBalance
    );
  };
}
