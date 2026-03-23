import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { sql } from "kysely";
import multer from "multer";
import { db } from "../../db";
import type { Json } from "../../db/models";
import { fileImportService } from "../../services/fileImportService";
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

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // 100KB
    fileSize: 100 * 1024,
  },
});

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
  "/budgets/:budgetId/accounts/:accountId/transactions/import-csv",
  async (
    req: Request<{ budgetId: string; accountId: string }, {}, ImportCsvRequest>,
    res: Response,
  ) => {
    const { config, rows } = req.body;
    try {
      const result = await importTransactionsService.importTransactions(
        db,
        req.params.budgetId,
        req.params.accountId,
        config,
        rows,
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
    const { transactionId } = await transactionsService.insertTransaction(
      db,
      req.params.budgetId,
      req.body,
    );

    res.status(200).send({ transactionId });
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

transactionsRouter.post(
  "/budgets/:budgetId/accounts/:accountId/reconcile",
  async (
    req: Request<
      { budgetId: string; accountId: string },
      {},
      { transactionIds: string[] }
    >,
    res: Response,
  ) => {
    const { transactionIds } = req.body;

    await reconciliationService.reconcileTransactions(
      db,
      req.params.budgetId,
      req.params.accountId,
      transactionIds,
    );

    res.status(200).send({});
  },
);

transactionsRouter.delete(
  "/budgets/:budgetId/accounts/:accountId/transactions/:transactionId/reconcile",
  async (
    req: Request<{
      budgetId: string;
      accountId: string;
      transactionId: string;
    }>,
    res: Response,
  ) => {
    await reconciliationService.unreconcileTransaction(
      db,
      req.params.budgetId,
      req.params.accountId,
      req.params.transactionId,
    );

    res.status(200).send({});
  },
);

transactionsRouter.post(
  "/budgets/:budgetId/accounts/:accountId/transactions/import-file",
  fileUpload.single("file"),
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response,
  ) => {
    if (!req.file) {
      res.status(422).json({ error: "No file provided" });
      return;
    }

    const importId = await fileImportService.startImportJob(
      db,
      req.params.budgetId,
      req.params.accountId,
      req.file.buffer,
    );

    res.status(202).json({ importId });
  },
);

transactionsRouter.get(
  "/budgets/:budgetId/accounts/:accountId/transactions/import-file/:importId",
  async (
    req: Request<{
      budgetId: string;
      accountId: string;
      importId: string;
    }>,
    res: Response,
  ) => {
    const job = await fileImportService.getJobStatus(
      db,
      req.params.importId,
      req.params.accountId,
    );

    if (!job) {
      res.status(404).json({ error: "Import job not found" });
      return;
    }

    res.json(job);
  },
);

// Multer error handler — converts file size limit errors to 422
transactionsRouter.use(
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      res.status(422).json({ error: "File too large. Maximum size is 100KB." });
      return;
    }
    next(err);
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
