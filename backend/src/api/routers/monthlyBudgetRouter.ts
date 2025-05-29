import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type {
  CreateTransaction,
  UpdateTransaction,
  MonthOfYear,
} from "../../services/models";
import { accountBalanceService } from "../../services/accountBalanceService";
import { isValidMonthOfYear } from "../../services/utils";

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);
transactionsRouter.use(authorizeRequest);

transactionsRouter.get(
  "/budgets/:budgetId/monthly-budget",
  async (
    req: Request<{ budgetId: string }, any, any, MonthOfYear>,
    res: Response
  ) => {
    if (!isValidMonthOfYear(req.query)) {
      res.status(400).json({ error: "Invalid month of year" });
      return;
    }

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

        const amountOrDateWereTouched =
          !!req.body.amount || req.body.amount === 0 || !!req.body.date;

        if (amountOrDateWereTouched) {
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
        const dates = await trx
          .deleteFrom("transactions")
          .where("id", "in", transactionIds)
          .where("accountId", "=", req.params.accountId)
          .returning(["date"])
          .execute();

        if (dates.length > 0) {
          await accountBalanceService.updateAccountBalance(
            trx,
            req.params.accountId,
            dates
          );
        }
      });

    res.status(200).send({});
  }
);
