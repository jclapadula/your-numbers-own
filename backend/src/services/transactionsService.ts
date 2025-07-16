import type { Kysely } from "kysely";
import type { CreateTransaction, UpdateTransaction } from "./models";
import type { DB } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { toZonedDate } from "./ZonedDate";
import { budgetsService } from "./budgetsService";
import { balanceUpdater } from "./balanceUpdater";

export namespace transactionsService {
  export const insertTransaction = async (
    db: Kysely<DB>,
    budgetId: string,
    transaction: CreateTransaction
  ) => {
    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const { date } = (
          await trx
            .insertInto("transactions")
            .values({ ...transaction })
            .returning(["date"])
            .execute()
        )[0]!;

        // post insert side effects
        const timezone = await budgetsService.getBudgetTimezone(budgetId);
        const zonedDate = toZonedDate(date, timezone);

        if (!isNaN(transaction.amount)) {
          await accountBalanceService.updateAccountBalance(
            trx,
            budgetId,
            transaction.accountId,
            [{ date: zonedDate }]
          );

          await balanceUpdater.updateMonthlyBalances(trx, budgetId, [
            { date: zonedDate, categories: [transaction.categoryId] },
          ]);
        }
      });
  };

  export const patchTransaction = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    transactionId: string,
    transactionUpdates: UpdateTransaction
  ) => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    let { date: oldDate, categoryId: oldCategoryId } =
      (await db
        .selectFrom("transactions")
        .where("id", "=", transactionId)
        .select(["date", "categoryId"])
        .executeTakeFirst()) || {};

    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const { date } = (
          await trx
            .updateTable("transactions")
            .set({ ...transactionUpdates })
            .where("id", "=", transactionId)
            .returning(["date"])
            .execute()
        )[0]!;

        // Post update side effects
        const amountChanged =
          !!transactionUpdates.amount || transactionUpdates.amount === 0;
        const dateChanged = !!transactionUpdates.date;

        if (amountChanged || dateChanged) {
          await accountBalanceService.updateAccountBalance(
            trx,
            budgetId,
            accountId,
            [
              {
                date: toZonedDate(date, timezone),
                ...(oldDate ? [toZonedDate(oldDate, timezone)] : []),
              },
            ]
          );
        }

        const categoryChanged = transactionUpdates.categoryId !== undefined;
        if (amountChanged || dateChanged || categoryChanged) {
          const categories = [
            transactionUpdates.categoryId,
            oldCategoryId,
          ].filter((category) => category !== undefined);

          await balanceUpdater.updateMonthlyBalances(trx, budgetId, [
            { date: toZonedDate(date, timezone), categories },
          ]);
        }
      });
  };
}
