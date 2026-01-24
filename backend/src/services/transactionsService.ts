import type { Kysely, Selectable } from "kysely";
import type { CreateTransaction, UpdateTransaction } from "./models";
import type { DB, Transactions } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { toZonedDate } from "./ZonedDate";
import { budgetsService } from "./budgetsService";
import { balanceUpdater } from "./balanceUpdater";
import { transfersService, type AffectedTransaction } from "./transfersService";
import { isEmpty } from "lodash";

export namespace transactionsService {
  const _updateAccountBalancesForAffectedAccounts = async (
    trx: Kysely<DB>,
    budgetId: string,
    affectedTransactions: AffectedTransaction[],
  ) => {
    const affectedAccounts = new Set(
      affectedTransactions.map((t) => t.accountId),
    );

    for (const accountId of affectedAccounts) {
      const accountTransactions = affectedTransactions.filter(
        (t) => t.accountId === accountId,
      );
      await accountBalanceService.updateAccountBalance(
        trx,
        budgetId,
        accountId,
        accountTransactions,
      );
    }
  };

  const _updateMonthlyBalancesForAffectedTransactions = async (
    trx: Kysely<DB>,
    budgetId: string,
    affectedTransactions: AffectedTransaction[],
  ) => {
    await balanceUpdater.updateMonthlyBalances(
      trx,
      budgetId,
      affectedTransactions.map((t) => ({
        date: t.date,
        categories: [t.categoryId],
      })),
    );
  };

  const _postInsertSideEffects = async (
    trx: Kysely<DB>,
    budgetId: string,
    { transactionId, amount }: { transactionId: string; amount: number },
    destinationAccountId: string | null | undefined,
  ) => {
    if (isNaN(amount)) {
      return;
    }
    const transferResult = await transfersService.createTransfer(
      trx,
      budgetId,
      transactionId,
      destinationAccountId,
    );

    if (amount === 0) {
      // Nothing to recalculate
      return;
    }

    await _updateAccountBalancesForAffectedAccounts(
      trx,
      budgetId,
      transferResult.affectedTransactions,
    );

    await _updateMonthlyBalancesForAffectedTransactions(
      trx,
      budgetId,
      transferResult.affectedTransactions,
    );
  };

  export const insertTransaction = async (
    db: Kysely<DB>,
    budgetId: string,
    transaction: CreateTransaction,
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
          destinationAccountId,
        );
      });
  };

  const _postUpdateSideEffects = async (
    trx: Kysely<DB>,
    budgetId: string,
    oldTransaction: Selectable<Transactions>,
    transactionUpdates: UpdateTransaction,
  ) => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    let affectedTransactions: AffectedTransaction[] = [
      { ...oldTransaction, date: toZonedDate(oldTransaction.date, timezone) },
    ];

    const wasTransfer = oldTransaction.transferId;
    const isNowTransfer = transactionUpdates.destinationAccountId;
    if (wasTransfer) {
      const transferResult = await transfersService.updateTransfer(
        trx,
        budgetId,
        oldTransaction.id,
        transactionUpdates.destinationAccountId,
      );

      affectedTransactions.push(...transferResult.affectedTransactions);
    } else if (isNowTransfer) {
      const transferResult = await transfersService.createTransfer(
        trx,
        budgetId,
        oldTransaction.id,
        transactionUpdates.destinationAccountId,
      );

      affectedTransactions.push(...transferResult.affectedTransactions);
    }

    const amountChanged =
      !!transactionUpdates.amount || transactionUpdates.amount === 0;
    const dateChanged = !!transactionUpdates.date;

    if (amountChanged || dateChanged) {
      await _updateAccountBalancesForAffectedAccounts(
        trx,
        budgetId,
        affectedTransactions,
      );

      await _updateMonthlyBalancesForAffectedTransactions(
        trx,
        budgetId,
        affectedTransactions,
      );
    }

    const categoryChanged = transactionUpdates.categoryId !== undefined;
    if (amountChanged || dateChanged || categoryChanged) {
      const categories = [
        transactionUpdates.categoryId,
        oldTransaction.categoryId,
      ].filter((category) => category !== undefined);

      const minDate = [...affectedTransactions].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
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
    transactionUpdates: UpdateTransaction,
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
        const { destinationAccountId: _, ...updateData } = transactionUpdates;

        if (!isEmpty(updateData)) {
          await trx
            .updateTable("transactions")
            .set({ ...updateData })
            .where("id", "=", transactionId)
            .execute();
        }

        await _postUpdateSideEffects(
          trx,
          budgetId,
          oldTransaction,
          transactionUpdates,
        );
      });
  };

  export const deleteTransactions = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    transactionIds: string[],
  ) => {
    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const transactionsDeletedByTransfer: AffectedTransaction[] = [];

        for (const transactionId of transactionIds) {
          const transferResult = await transfersService.deleteTransfer(
            trx,
            budgetId,
            transactionId,
          );
          transactionsDeletedByTransfer.push(
            ...transferResult.affectedTransactions,
          );
        }

        const timezone = await budgetsService.getBudgetTimezone(budgetId);

        const deletedTransactions = await trx
          .deleteFrom("transactions")
          .where("id", "in", transactionIds)
          .where("accountId", "=", accountId)
          .returning(["date", "categoryId", "accountId"])
          .execute();

        const deletedIndividualTransactions = deletedTransactions.map(
          (t) =>
            ({
              ...t,
              date: toZonedDate(t.date, timezone),
            }) satisfies AffectedTransaction,
        );

        const allAffectedTransactions = [
          ...transactionsDeletedByTransfer,
          ...deletedIndividualTransactions,
        ];

        await _updateAccountBalancesForAffectedAccounts(
          trx,
          budgetId,
          allAffectedTransactions,
        );

        await _updateMonthlyBalancesForAffectedTransactions(
          trx,
          budgetId,
          allAffectedTransactions,
        );
      });
  };
}
