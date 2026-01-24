import { Router } from "express";
import type { Request, Response } from "express";
import { sql } from "kysely";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type {
  CreateTransaction,
  Transaction,
  UpdateTransaction,
} from "../../services/models";
import { transactionsService } from "../../services/transactionsService";

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);
transactionsRouter.use(authorizeRequest);

transactionsRouter.get(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response,
  ) => {
    const transactions: Transaction[] = await db
      .selectFrom("transactions")
      .leftJoin("transfers", "transactions.transferId", "transfers.id")
      .where("accountId", "=", req.params.accountId)
      .orderBy("date", "desc")
      .orderBy("id")
      .select([
        "transactions.id",
        "transactions.date",
        "transactions.accountId",
        "transactions.amount",
        "transactions.categoryId",
        "transactions.isReconciled",
        "transactions.notes",
        "transactions.payeeId",
        sql<string | null>`
          CASE
            WHEN transactions."accountId" = transfers."fromAccountId" THEN transfers."toAccountId"
            WHEN transactions."accountId" = transfers."toAccountId" THEN transfers."fromAccountId"
            ELSE NULL
          END
        `.as("destinationAccountId"),
      ])
      .execute();

    res.json(transactions);
  },
);

transactionsRouter.post(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<
      { budgetId: string; accountId: string },
      {},
      CreateTransaction
    >,
    res: Response,
  ) => {
    await transactionsService.insertTransaction(
      db,
      req.params.budgetId,
      req.body,
    );

    res.status(200).send({});
  },
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
    res: Response,
  ) => {
    const { transactionId } = req.params;

    await transactionsService.patchTransaction(
      db,
      req.params.budgetId,
      transactionId,
      req.body,
    );

    res.status(200).send({});
  },
);

transactionsRouter.delete(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<
      { budgetId: string; accountId: string },
      {},
      { transactionIds: string[] }
    >,
    res: Response,
  ) => {
    const { transactionIds } = req.body;

    await transactionsService.deleteTransactions(
      db,
      req.params.budgetId,
      req.params.accountId,
      transactionIds,
    );

    res.status(200).send({});
  },
);
