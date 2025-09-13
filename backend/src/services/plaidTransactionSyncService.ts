import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import type {
  TransactionsGetRequest,
  Transaction as PlaidTransaction,
  WebhookVerificationKeyGetRequest,
  TransactionsSyncRequest,
  TransactionsSyncResponse,
  RemovedTransaction,
} from "plaid";
import type { Insertable, Kysely } from "kysely";
import type { DB, Transactions } from "../db/models";
import type { CreateTransaction } from "./models";
import { transactionsService } from "./transactionsService";
import crypto from "crypto";
import { parseISO } from "date-fns";
import { balanceUpdater } from "./balanceUpdater";
import { accountBalanceService } from "./accountBalanceService";
import { budgetsService } from "./budgetsService";
import { toZonedDate } from "./ZonedDate";

export namespace plaidTransactionSyncService {
  let plaidClient: PlaidApi;

  const initializePlaidClient = () => {
    if (!plaidClient) {
      const environment =
        process.env.PLAID_ENVIRONMENT === "production"
          ? PlaidEnvironments.production
          : PlaidEnvironments.sandbox;

      const configuration = new Configuration({
        basePath: environment,
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
            "PLAID-SECRET": process.env.PLAID_SECRET!,
          },
        },
      });
      plaidClient = new PlaidApi(configuration);
    }
    return plaidClient;
  };

  const updateAccountAndMonthlyBalances = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    modifiedTransactions: (PlaidTransaction | RemovedTransaction)[]
  ) => {
    const modifiedCategories = await db
      .selectFrom("transactions")
      .where("accountId", "=", accountId)
      .where(
        "plaid_transaction_id",
        "in",
        modifiedTransactions.map((tx) => tx.transaction_id)
      )
      .select(({ eb }) => [
        "categoryId",
        eb.fn.max("date").as("maxDate"),
        eb.fn.min("date").as("minDate"),
      ])
      .groupBy("categoryId")
      .execute();

    const timezone = await budgetsService.getBudgetTimezone(budgetId);
    const categoriesWithDateLimits = modifiedCategories.flatMap(
      ({ categoryId, maxDate, minDate }) => [
        { categoryId, date: toZonedDate(maxDate, timezone) },
        { categoryId, date: toZonedDate(minDate, timezone) },
      ]
    );
    await accountBalanceService.updateAccountBalance(
      db,
      budgetId,
      accountId,
      categoriesWithDateLimits
    );

    const categoriesForBalanceUpdater = categoriesWithDateLimits.map(
      ({ categoryId, date }) => ({ date, categories: [categoryId] })
    );
    await balanceUpdater.updateMonthlyBalances(
      db,
      budgetId,
      categoriesForBalanceUpdater
    );
  };

  const handleTransactionsResponse = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    response: TransactionsSyncResponse
  ) => {
    await db.transaction().execute(async (db) => {
      await db
        .deleteFrom("transactions")
        .where("accountId", "=", accountId)
        .where(
          "plaid_account_id",
          "in",
          response.removed.map((tx) => tx.transaction_id)
        )
        .execute();

      const addedAndModified = [...response.added, ...response.modified];
      await db
        .insertInto("transactions")
        .values(
          addedAndModified.map(
            (tx) =>
              ({
                accountId,
                plaid_account_id: accountId,
                plaid_transaction_id: tx.transaction_id,
                merchant_name: tx.merchant_name || null,
                date: tx.date,
                amount: -tx.amount,
                isReconciled: !tx.pending,
                notes: tx.merchant_name || tx.original_description,
              } satisfies Insertable<Transactions>)
          )
        )
        .onConflict((oc) =>
          oc.columns(["plaid_transaction_id", "plaid_account_id"]).doUpdateSet({
            merchant_name: (eb) => eb.ref("excluded.merchant_name"),
            date: (eb) => eb.ref("excluded.date"),
            amount: (eb) => eb.ref("excluded.amount"),
            isReconciled: (eb) => eb.ref("excluded.isReconciled"),
          })
        )
        .execute();

      await db
        .updateTable("plaid_accounts")
        .set({ next_cursor: response.next_cursor })
        .where("account_id", "=", accountId)
        .execute();

      // update account and partial balances
      await updateAccountAndMonthlyBalances(db, budgetId, accountId, [
        ...response.added,
        ...response.modified,
        ...response.removed,
      ]);
    });
  };

  export const syncTransactions = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string
  ) => {
    const client = initializePlaidClient();

    const account = await db
      .selectFrom("plaid_accounts")
      .where("budget_id", "=", budgetId)
      .where("account_id", "=", accountId)
      .selectAll()
      .executeTakeFirstOrThrow();

    const request: TransactionsSyncRequest = {
      access_token: account.access_token,
      options: {
        account_id: account.plaid_account_id,
      },
    };

    const response = await client.transactionsSync(request);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to sync transactions for account ${account.id}`);
    }

    await handleTransactionsResponse(db, budgetId, accountId, response.data);

    if (response.data.has_more) {
      console.log("Calling syncTransactions again");
      await syncTransactions(db, budgetId, accountId);
    }
  };
}
