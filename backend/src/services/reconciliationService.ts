import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { budgetsService } from "./budgetsService";
import { toZonedDate } from "./ZonedDate";

export namespace reconciliationService {
  export const reconcileTransactions = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    transactionIds: string[],
  ) => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);

    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const transactions = await trx
          .selectFrom("transactions")
          .where("id", "in", transactionIds)
          .where("accountId", "=", accountId)
          .select(["id", "date"])
          .execute();

        if (transactions.length === 0) return;

        await trx
          .updateTable("transactions")
          .set({ isReconciled: true })
          .where("id", "in", transactionIds)
          .where("accountId", "=", accountId)
          .execute();

        const zonedTransactions = transactions.map((t) => ({
          date: toZonedDate(t.date, timezone),
        }));

        await accountBalanceService.updateAccountBalance(
          trx,
          budgetId,
          accountId,
          zonedTransactions,
        );
      });
  };
}
