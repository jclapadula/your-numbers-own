import type { Kysely } from "kysely";
import type {
  CreateTransaction,
  Transaction,
  UpdateTransaction,
} from "./models";
import type { DB } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { toZonedDate } from "./ZonedDate";
import { budgetsService } from "./budgetsService";
import { balanceUpdater } from "./balanceUpdater";
import { transfersService, type AffectedTransaction } from "./transfersService";

export namespace transactionsService {
  const _postInsertSideEffects = async (
    trx: Kysely<DB>,
    budgetId: string,
    { transactionId, amount }: { transactionId: string; amount: number },
    destinationAccountId: string | null | undefined
  ) => {
    if (isNaN(amount)) {
      return;
    }
    const transferResult = await transfersService.createTransfer(
      trx,
      budgetId,
      transactionId,
      destinationAccountId
    );

    if (amount === 0) {
      // Nothing to recalculate
      return;
    }

    const affectedAccounts = new Set(
      transferResult.affectedTransactions.map((t) => t.accountId)
    );

    for (const accountId of affectedAccounts) {
      const accountTransactions = transferResult.affectedTransactions.filter(
        (t) => t.accountId === accountId
      );
      await accountBalanceService.updateAccountBalance(
        trx,
        budgetId,
        accountId,
        accountTransactions
      );
    }

    await balanceUpdater.updateMonthlyBalances(
      trx,
      budgetId,
      transferResult.affectedTransactions.map((t) => ({
        date: t.date,
        categories: [t.categoryId],
      }))
    );
  };

  export const insertTransaction = async (
    db: Kysely<DB>,
    budgetId: string,
    transaction: CreateTransaction
  ) => {
    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const { destinationAccountId, ...transactionData } = transaction;

        const { id: transactionId } = (
          await trx
            .insertInto("transactions")
            .values({ ...transactionData })
            .returning(["id", "date"])
            .execute()
        )[0]!;

        await _postInsertSideEffects(
          trx,
          budgetId,
          { transactionId, amount: transaction.amount },
          destinationAccountId
        );
      });
  };

  const _postUpdateSideEffects = async (
    trx: Kysely<DB>,
    budgetId: string,
    oldTransaction: Transaction,
    transactionUpdates: UpdateTransaction,
    destinationAccountId: string | null | undefined
  ) => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    let affectedTransactions: AffectedTransaction[] = [
      { ...oldTransaction, date: toZonedDate(oldTransaction.date, timezone) },
    ];
    if (oldTransaction.transferId) {
      const transferResult = await transfersService.updateTransfer(
        trx,
        budgetId,
        oldTransaction.id,
        destinationAccountId
      );

      affectedTransactions.push(...transferResult.affectedTransactions);
    } else if (destinationAccountId !== null) {
      const transferResult = await transfersService.createTransfer(
        trx,
        budgetId,
        oldTransaction.id,
        destinationAccountId
      );

      affectedTransactions.push(...transferResult.affectedTransactions);
    }

    const amountChanged =
      !!transactionUpdates.amount || transactionUpdates.amount === 0;
    const dateChanged = !!transactionUpdates.date;

    if (amountChanged || dateChanged) {
      const affectedAccounts = new Set(
        affectedTransactions.map((t) => t.accountId)
      );

      for (const accountId of affectedAccounts) {
        const accountTransactions = affectedTransactions.filter(
          (t) => t.accountId === accountId
        );
        await accountBalanceService.updateAccountBalance(
          trx,
          budgetId,
          accountId,
          accountTransactions
        );
      }

      await balanceUpdater.updateMonthlyBalances(
        trx,
        budgetId,
        affectedTransactions.map((t) => ({
          date: t.date,
          categories: [t.categoryId],
        }))
      );
    }

    const categoryChanged = transactionUpdates.categoryId !== undefined;
    if (amountChanged || dateChanged || categoryChanged) {
      const categories = [
        transactionUpdates.categoryId,
        oldTransaction.categoryId,
      ].filter((category) => category !== undefined);

      const minDate = [...affectedTransactions].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      )[0]!.date;

      await balanceUpdater.updateMonthlyBalances(trx, budgetId, [
        { date: toZonedDate(minDate, timezone), categories },
      ]);
    }
  };

  export const patchTransaction = async (
    db: Kysely<DB>,
    budgetId: string,
    transactionId: string,
    transactionUpdates: UpdateTransaction
  ) => {
    const oldTransaction = await db
      .selectFrom("transactions")
      .where("id", "=", transactionId)
      .selectAll()
      .executeTakeFirstOrThrow();

    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const { destinationAccountId, ...updateData } = transactionUpdates;

        await trx
          .updateTable("transactions")
          .set({ ...updateData })
          .where("id", "=", transactionId)
          .returning(["date"])
          .execute();

        await _postUpdateSideEffects(
          trx,
          budgetId,
          oldTransaction,
          transactionUpdates,
          destinationAccountId
        );
      });
  };
}
