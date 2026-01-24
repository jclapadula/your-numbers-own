import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type {
  CreateTransaction,
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

    await transactionsService.deleteTransactions(
      db,
      req.params.budgetId,
      req.params.accountId,
      transactionIds
    );

    res.status(200).send({});
  }
);
