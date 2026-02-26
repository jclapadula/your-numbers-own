import type { Request, Response } from "express";
import { Router } from "express";
import { sql } from "kysely";
import { db } from "../../db";
import type { Json } from "../../db/models";
import { importTransactionsService } from "../../services/importTransactionsService";
import type {
  CreateTransaction,
  ImportCsvRequest,
  Transaction,
  UpdateTransaction,
} from "../../services/models";
import { reconciliationService } from "../../services/reconciliationService";
import { transactionsService } from "../../services/transactionsService";
import { authenticate, authorizeRequest } from "../middlewares";

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);
transactionsRouter.use(authorizeRequest);

transactionsRouter.get(
  "/budgets/:budgetId/accounts/:accountId/transactions",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response
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
  }
);

transactionsRouter.post(
  "/budgets/:budgetId/accounts/:accountId/transactions/import-csv",
  async (
    req: Request<{ budgetId: string; accountId: string }, {}, ImportCsvRequest>,
    res: Response
  ) => {
    const { config, rows } = req.body;
    try {
      const result = await importTransactionsService.importTransactions(
        db,
        req.params.budgetId,
        req.params.accountId,
        config,
        rows
      );

      await db
        .updateTable("accounts")
        .set({ csv_import_config: config as unknown as Json })
        .where("id", "=", req.params.accountId)
        .execute();

      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.name === "ImportRowParseError") {
        res.status(422).json({ error: err.message });
        return;
      }
      throw err;
    }
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

transactionsRouter.post(
  "/budgets/:budgetId/accounts/:accountId/reconcile",
  async (
    req: Request<
      { budgetId: string; accountId: string },
      {},
      { transactionIds: string[] }
    >,
    res: Response
  ) => {
    const { transactionIds } = req.body;

    await reconciliationService.reconcileTransactions(
      db,
      req.params.budgetId,
      req.params.accountId,
      transactionIds
    );

    res.status(200).send({});
  }
);

transactionsRouter.delete(
  "/budgets/:budgetId/accounts/:accountId/transactions/:transactionId/reconcile",
  async (
    req: Request<{
      budgetId: string;
      accountId: string;
      transactionId: string;
    }>,
    res: Response
  ) => {
    await reconciliationService.unreconcileTransaction(
      db,
      req.params.budgetId,
      req.params.accountId,
      req.params.transactionId
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
