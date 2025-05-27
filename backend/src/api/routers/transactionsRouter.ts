import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type {
  CreateTransaction,
  UpdateTransaction,
} from "../../services/models";
import { accountBalanceService } from "../../services/accountBalanceService";

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
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const { date } = (
          await trx
            .insertInto("transactions")
            .values({ ...req.body })
            .returning(["date"])
            .execute()
        )[0]!;

        if (!isNaN(req.body.amount)) {
          await accountBalanceService.updateAccountBalance(
            trx,
            req.params.accountId,
            [{ date }]
          );
        }
      });

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
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const { date } = (
          await trx
            .updateTable("transactions")
            .set({ ...req.body })
            .where("id", "=", transactionId)
            .returning(["date"])
            .execute()
        )[0]!;

        const amountWasTouched = !!req.body.amount || req.body.amount === 0;

        if (amountWasTouched) {
          await accountBalanceService.updateAccountBalance(
            trx,
            req.params.accountId,
            [{ date }]
          );
        }
      });

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
