import type { Kysely } from "kysely";
import type { CreateTransaction, UpdateTransaction } from "./models";
import type { DB } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { monthlyBudgetService } from "./monthlyBudgetService";

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

        if (!isNaN(transaction.amount)) {
          await accountBalanceService.updateAccountBalance(
            trx,
            transaction.accountId,
            [{ date }]
          );

          await monthlyBudgetService.updateMonthlyBudgets(trx, budgetId, [
            { date, categories: [transaction.categoryId] },
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
    const { date: oldDate, categoryId: oldCategoryId } =
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

        const amountChanged =
          !!transactionUpdates.amount || transactionUpdates.amount === 0;
        const dateChanged = !!transactionUpdates.date;

        if (amountChanged || dateChanged) {
          await accountBalanceService.updateAccountBalance(trx, accountId, [
            { date, ...(oldDate ? [oldDate] : []) },
          ]);
        }

        const categoryChanged = transactionUpdates.categoryId !== undefined;
        if (amountChanged || dateChanged || categoryChanged) {
          const categories = [
            transactionUpdates.categoryId,
            oldCategoryId,
          ].filter((category) => category !== undefined);

          await monthlyBudgetService.updateMonthlyBudgets(trx, budgetId, [
            { date, categories },
          ]);
        }
      });
  };
}
