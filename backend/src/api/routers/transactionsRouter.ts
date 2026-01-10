import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type {
  CreateTransaction,
  UpdateTransaction,
} from "../../services/models";
import { accountBalanceService } from "../../services/accountBalanceService";
import { transactionsService } from "../../services/transactionsService";
import { budgetsService } from "../../services/budgetsService";
import { toZonedDate } from "../../services/ZonedDate";
import { balanceUpdater } from "../../services/balanceUpdater";
import { transfersService } from "../../services/transfersService";

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);
transactionsRouter.use(authorizeRequest);

transactionsRouter.get(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response
  ) => {
    const transactions = await db
      .selectFrom("transactions")
      .where("accountId", "=", req.params.accountId)
      .orderBy("date", "desc")
      .orderBy("id")
      .selectAll()
      .execute();

    res.json(transactions);
  }
);

transactionsRouter.post(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<
      { budgetId: string; accountId: string },
      {},
      CreateTransaction
    >,
    res: Response
  ) => {
    await transactionsService.insertTransaction(
      db,
      req.params.budgetId,
      req.body
    );

    res.status(200).send({});
  }
);

transactionsRouter.patch(
  "/budgets/:budgetId/accounts/:accountId/transactions/:transactionId",
  async (
    req: Request<
      {
        budgetId: string;
        accountId: string;
        transactionId: string;
      },
      {},
      UpdateTransaction
    >,
    res: Response
  ) => {
    const { transactionId } = req.params;

    await transactionsService.patchTransaction(
      db,
      req.params.budgetId,
      transactionId,
      req.body
    );

    res.status(200).send({});
  }
);

transactionsRouter.delete(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<
      { budgetId: string; accountId: string },
      {},
      { transactionIds: string[] }
    >,
    res: Response
  ) => {
    const { transactionIds } = req.body;

    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const allAffectedTransactions = [];

        for (const transactionId of transactionIds) {
          const transferResult = await transfersService.deleteTransfer(
            trx,
            req.params.budgetId,
            transactionId
          );
          allAffectedTransactions.push(...transferResult.affectedTransactions);
        }

        if (allAffectedTransactions.length === 0) {
          const timezone = await budgetsService.getBudgetTimezone(
            req.params.budgetId
          );

          const deletedTransactions = await trx
            .deleteFrom("transactions")
            .where("id", "in", transactionIds)
            .where("accountId", "=", req.params.accountId)
            .returning(["date", "categoryId"])
            .execute();

          if (deletedTransactions.length > 0) {
            await accountBalanceService.updateAccountBalance(
              trx,
              req.params.budgetId,
              req.params.accountId,
              deletedTransactions.map(({ date }) => ({
                date: toZonedDate(date, timezone),
              }))
            );

            await balanceUpdater.updateMonthlyBalances(
              trx,
              req.params.budgetId,
              deletedTransactions.map(({ date, categoryId }) => ({
                date: toZonedDate(date, timezone),
                categories: [categoryId],
              }))
            );
          }
        } else {
          const affectedAccounts = new Set(
            allAffectedTransactions.map((t) => t.accountId)
          );

          for (const accountId of affectedAccounts) {
            const accountTransactions = allAffectedTransactions.filter(
              (t) => t.accountId === accountId
            );
            await accountBalanceService.updateAccountBalance(
              trx,
              req.params.budgetId,
              accountId,
              accountTransactions
            );
          }

          await balanceUpdater.updateMonthlyBalances(
            trx,
            req.params.budgetId,
            allAffectedTransactions.map((t) => ({
              date: t.date,
              categories: [t.categoryId],
            }))
          );
        }
      });

    res.status(200).send({});
  }
);
