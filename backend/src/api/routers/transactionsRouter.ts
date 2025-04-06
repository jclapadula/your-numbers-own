import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type {
  CreateTransaction,
  UpdateTransaction,
} from "../../services/models";

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
    await db
      .insertInto("transactions")
      .values({ ...req.body })
      .execute();

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

    await db
      .updateTable("transactions")
      .set({ ...req.body })
      .where("id", "=", transactionId)
      .execute();

    res.status(200).send({});
  }
);

transactionsRouter.delete(
  "/budgets/:budgetId/accounts/:accountId/transactions/:transactionId",
  async (
    req: Request<{
      budgetId: string;
      accountId: string;
      transactionId: string;
    }>,
    res: Response
  ) => {
    const { transactionId } = req.params;

    await db
      .deleteFrom("transactions")
      .where("id", "=", transactionId)
      .execute();

    res.status(200).send({});
  }
);
