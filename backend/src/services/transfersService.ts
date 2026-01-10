import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import type { ZonedDate } from "./ZonedDate";
import { toZonedDate } from "./ZonedDate";
import { budgetsService } from "./budgetsService";

export type AffectedTransaction = {
  accountId: string;
  date: ZonedDate;
  categoryId: string | null;
};

export type TransferResult = {
  affectedTransactions: AffectedTransaction[];
};

export namespace transfersService {
  /**
   * Validates that both accounts belong to the same budget and are not deleted.
   * Also validates that the accounts are different.
   */
  const validateAccounts = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId1: string,
    accountId2: string
  ): Promise<void> => {
    if (accountId1 === accountId2) {
      throw new Error("Source and destination accounts must be different");
    }

    // Validate that both accounts belong to the same budget
    const accounts = await db
      .selectFrom("accounts")
      .where("id", "in", [accountId1, accountId2])
      .where("budgetId", "=", budgetId)
      .where("deletedAt", "is", null)
      .select(["id"])
      .execute();

    if (accounts.length !== 2) {
      throw new Error(
        "Both accounts must belong to the same budget and not be deleted"
      );
    }
  };

  /**
   * Creates a transfer between two accounts based on an existing transaction.
   * The source transaction must already exist in the database.
   */
  export const createTransfer = async (
    db: Kysely<DB>,
    budgetId: string,
    sourceTransactionId: string,
    destinationAccountId: string | null | undefined
  ): Promise<TransferResult> => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    const sourceTransaction = await db
      .selectFrom("transactions")
      .where("id", "=", sourceTransactionId)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (!destinationAccountId) {
      return {
        affectedTransactions: [
          {
            accountId: sourceTransaction.accountId,
            date: toZonedDate(sourceTransaction.date, timezone),
            categoryId: sourceTransaction.categoryId,
          },
        ],
      };
    }

    await validateAccounts(
      db,
      budgetId,
      sourceTransaction.accountId,
      destinationAccountId
    );

    const transfer = await db
      .insertInto("transfers")
      .values({
        fromAccountId: sourceTransaction.accountId,
        toAccountId: destinationAccountId,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    await db
      .updateTable("transactions")
      .set({
        transferId: transfer.id,
        categoryId: null,
      })
      .where("id", "=", sourceTransactionId)
      .execute();

    // Create the destination transaction with opposite amount
    const { id: _, ...otherProperties } = sourceTransaction;
    const destinationTransaction = await db
      .insertInto("transactions")
      .values({
        ...otherProperties,
        accountId: destinationAccountId,
        amount: -sourceTransaction.amount,
        categoryId: null,
        transferId: transfer.id,
      })
      .returning(["accountId", "date", "categoryId"])
      .executeTakeFirstOrThrow();

    return {
      affectedTransactions: [
        {
          accountId: sourceTransaction.accountId,
          date: toZonedDate(sourceTransaction.date, timezone),
          categoryId: sourceTransaction.categoryId,
        },
        {
          accountId: destinationTransaction.accountId,
          date: toZonedDate(destinationTransaction.date, timezone),
          categoryId: destinationTransaction.categoryId,
        },
      ],
    };
  };

  /**
   * Converts a transfer transaction back to a normal transaction.
   * Deletes the other leg of the transfer and the transfer record itself.
   */
  const removeTransfer = async (
    db: Kysely<DB>,
    budgetId: string,
    transferId: string,
    updatedTransactionId: string
  ): Promise<AffectedTransaction | null> => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    // Find the other transaction
    const otherTransaction = await db
      .selectFrom("transactions")
      .where("transferId", "=", transferId)
      .where("id", "!=", updatedTransactionId)
      .select(["id", "accountId", "date", "categoryId"])
      .executeTakeFirst();

    if (otherTransaction) {
      await db
        .deleteFrom("transactions")
        .where("id", "=", otherTransaction.id)
        .execute();
    }

    await db.deleteFrom("transfers").where("id", "=", transferId).execute();

    await db
      .updateTable("transactions")
      .set({ transferId: null })
      .where("id", "=", updatedTransactionId)
      .execute();

    return otherTransaction
      ? {
          accountId: otherTransaction.accountId,
          date: toZonedDate(otherTransaction.date, timezone),
          categoryId: otherTransaction.categoryId,
        }
      : null;
  };

  /**
   * Updates a transfer based on changes to one of its transactions.
   * Updates the other leg of the transfer to match (with opposite amount).
   * If destinationAccountId is null, converts the transfer back to a normal transaction.
   */
  export const updateTransfer = async (
    db: Kysely<DB>,
    budgetId: string,
    updatedTransactionId: string,
    destinationAccountId: string | null | undefined
  ): Promise<TransferResult> => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    const updatedTransaction = await db
      .selectFrom("transactions")
      .where("id", "=", updatedTransactionId)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (!updatedTransaction.transferId) {
      return {
        affectedTransactions: [
          {
            ...updatedTransaction,
            date: toZonedDate(updatedTransaction.date, timezone),
          },
        ],
      };
    }

    if (!destinationAccountId) {
      const deletedOtherTransaction = await removeTransfer(
        db,
        budgetId,
        updatedTransaction.transferId,
        updatedTransactionId
      );

      const affectedTransactions: AffectedTransaction[] = [
        {
          accountId: updatedTransaction.accountId,
          date: toZonedDate(updatedTransaction.date, timezone),
          categoryId: updatedTransaction.categoryId,
        },
      ];
      if (deletedOtherTransaction) {
        affectedTransactions.push(deletedOtherTransaction);
      }

      return { affectedTransactions };
    }

    const transfer = await db
      .selectFrom("transfers")
      .where("id", "=", updatedTransaction.transferId)
      .select(["id", "fromAccountId", "toAccountId"])
      .executeTakeFirstOrThrow();

    // Determine which leg this is and find the other transaction
    const isFromAccount =
      updatedTransaction.accountId === transfer.fromAccountId;
    const otherAccountId = isFromAccount
      ? transfer.toAccountId
      : transfer.fromAccountId;

    const otherTransaction = await db
      .selectFrom("transactions")
      .where("transferId", "=", transfer.id)
      .where("id", "!=", updatedTransactionId)
      .select(["id", "accountId", "amount", "date", "categoryId"])
      .executeTakeFirstOrThrow();

    // Store old state for balance recalculation
    const oldOtherTransaction = {
      accountId: otherTransaction.accountId,
      date: toZonedDate(otherTransaction.date, timezone),
      categoryId: otherTransaction.categoryId,
    };

    const isDestinationAccountChanging =
      destinationAccountId !== otherAccountId;
    if (isDestinationAccountChanging) {
      await validateAccounts(
        db,
        budgetId,
        updatedTransaction.accountId,
        destinationAccountId
      );

      const update = isFromAccount
        ? { toAccountId: destinationAccountId }
        : { fromAccountId: destinationAccountId };
      await db
        .updateTable("transfers")
        .set(update)
        .where("id", "=", transfer.id)
        .execute();
    }

    const { id: _, ...otherProperties } = updatedTransaction;
    const updatedOtherTransaction = await db
      .updateTable("transactions")
      .set({
        ...otherProperties,
        accountId: destinationAccountId,
        amount: -updatedTransaction.amount,
        categoryId: null,
      })
      .where("id", "=", otherTransaction.id)
      .returning(["accountId", "date", "categoryId"])
      .executeTakeFirstOrThrow();

    // Ensure the updated transaction also has null category
    await db
      .updateTable("transactions")
      .set({ categoryId: null })
      .where("id", "=", updatedTransactionId)
      .execute();

    return {
      affectedTransactions: [
        {
          accountId: updatedTransaction.accountId,
          date: toZonedDate(updatedTransaction.date, timezone),
          categoryId: updatedTransaction.categoryId,
        },
        oldOtherTransaction,
        {
          accountId: updatedOtherTransaction.accountId,
          date: toZonedDate(updatedOtherTransaction.date, timezone),
          categoryId: updatedOtherTransaction.categoryId,
        },
      ],
    };
  };

  /**
   * Deletes a transfer if the given transaction is part of one.
   * Deletes both legs of the transfer and the transfer record itself.
   */
  export const deleteTransfer = async (
    db: Kysely<DB>,
    budgetId: string,
    transactionId: string
  ): Promise<TransferResult> => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    const transaction = await db
      .selectFrom("transactions")
      .where("id", "=", transactionId)
      .select(["id", "accountId", "date", "categoryId", "transferId"])
      .executeTakeFirstOrThrow();

    const affectedTransactions: AffectedTransaction[] = [];

    // If this transaction is part of a transfer, delete both legs
    if (!transaction.transferId) {
      return { affectedTransactions: [] };
    }

    // Find the other transaction
    const otherTransaction = await db
      .selectFrom("transactions")
      .where("transferId", "=", transaction.transferId)
      .where("id", "!=", transactionId)
      .select(["id", "accountId", "date", "categoryId"])
      .executeTakeFirst();

    await db
      .deleteFrom("transactions")
      .where("transferId", "=", transaction.transferId)
      .execute();

    await db
      .deleteFrom("transfers")
      .where("id", "=", transaction.transferId)
      .execute();

    affectedTransactions.push({
      accountId: transaction.accountId,
      date: toZonedDate(transaction.date, timezone),
      categoryId: transaction.categoryId,
    });
    if (otherTransaction) {
      affectedTransactions.push({
        accountId: otherTransaction.accountId,
        date: toZonedDate(otherTransaction.date, timezone),
        categoryId: otherTransaction.categoryId,
      });
    }

    return { affectedTransactions };
  };
}
