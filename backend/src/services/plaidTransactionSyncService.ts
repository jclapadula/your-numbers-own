import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import type {
  Transaction as PlaidTransaction,
  TransactionsSyncRequest,
  TransactionsSyncResponse,
  RemovedTransaction,
} from "plaid";
import type { Insertable, Kysely, Selectable } from "kysely";
import type { DB, Payees, Transactions } from "../db/models";
import { balanceUpdater } from "./balanceUpdater";
import { accountBalanceService } from "./accountBalanceService";
import { budgetsService } from "./budgetsService";
import { toZonedDate } from "./ZonedDate";
import _ from "lodash";

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
    modifiedTransactions: { categoryId: string | null; date: Date }[],
  ) => {
    const modifiedCategories = _(modifiedTransactions)
      .groupBy((tx) => tx.categoryId)
      .map((group) => ({
        categoryId: group[0]!.categoryId,
        maxDate: new Date(Math.max(...group.map((tx) => tx.date.getTime()))),
        minDate: new Date(Math.min(...group.map((tx) => tx.date.getTime()))),
      }))
      .value();

    const timezone = await budgetsService.getBudgetTimezone(budgetId);
    const categoriesWithDateLimits = modifiedCategories.flatMap(
      ({ categoryId, maxDate, minDate }) => [
        { categoryId, date: toZonedDate(maxDate, timezone) },
        { categoryId, date: toZonedDate(minDate, timezone) },
      ],
    );
    await accountBalanceService.updateAccountBalance(
      db,
      budgetId,
      accountId,
      categoriesWithDateLimits,
    );

    const categoriesForBalanceUpdater = categoriesWithDateLimits.map(
      ({ categoryId, date }) => ({ date, categories: [categoryId] }),
    );
    await balanceUpdater.updateMonthlyBalances(
      db,
      budgetId,
      categoriesForBalanceUpdater,
    );
  };

  const deleteTransactions = async (
    db: Kysely<DB>,
    accountId: string,
    removed: RemovedTransaction[],
  ) => {
    if (!removed.length) return [];

    return await db
      .deleteFrom("transactions")
      .where("accountId", "=", accountId)
      .where(
        "plaid_account_id",
        "in",
        removed.map((tx) => tx.transaction_id),
      )
      .returningAll()
      .execute();
  };

  const createMissingPayees = async (
    db: Kysely<DB>,
    budgetId: string,
    response: TransactionsSyncResponse,
  ) => {
    const allPayeesNames = new Set(
      [...response.added, ...response.modified]
        .map((t) => t.merchant_name)
        .filter((name): name is string => !!name),
    );
    if (!allPayeesNames.size) {
      return;
    }

    const existingPayees = new Set(
      (
        await db
          .selectFrom("payees")
          .select("name")
          .where("name", "in", [...allPayeesNames])
          .where("budgetId", "=", budgetId)
          .execute()
      ).map(({ name }) => name),
    );

    const payeesToCreate = allPayeesNames.difference(existingPayees);
    if (!payeesToCreate.size) {
      return;
    }

    await db
      .insertInto("payees")
      .values(
        [...payeesToCreate].map(
          (name) =>
            ({
              budgetId,
              name,
            } satisfies Insertable<Payees>),
        ),
      )
      .execute();
  };

  const getAllPayeesByName = async (
    db: Kysely<DB>,
    budgetId: string,
    response: TransactionsSyncResponse,
  ) => {
    const allPayeesNames = new Set(
      [...response.added, ...response.modified]
        .map((t) => t.merchant_name)
        .filter((name): name is string => !!name),
    );

    const allPayees = await db
      .selectFrom("payees")
      .select(["id", "name"])
      .where("name", "in", [...allPayeesNames])
      .where("budgetId", "=", budgetId)
      .execute();
    return allPayees;
  };

  const handleTransactionsResponse = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    response: TransactionsSyncResponse,
  ) => {
    await db.transaction().execute(async (db) => {
      const deletedTransactions = await deleteTransactions(
        db,
        accountId,
        response.removed,
      );

      await createMissingPayees(db, budgetId, response);

      const allPayees = await getAllPayeesByName(db, budgetId, response);
      const payeeIdByName = _(allPayees)
        .mapKeys(({ name }) => name)
        .mapValues(({ id }) => id)
        .value();

      const transactionsToUpsert = [
        ...response.added,
        ...response.modified,
      ].map(
        (trx) =>
          ({
            accountId,
            plaid_account_id: trx.account_id,
            plaid_transaction_id: trx.transaction_id,
            merchant_name: trx.merchant_name || null,
            date: trx.authorized_datetime || trx.authorized_date || trx.date,
            amount: -trx.amount * 100,
            isReconciled: !trx.pending,
            notes: trx.original_description,
            payeeId:
              (trx.merchant_name && payeeIdByName[trx.merchant_name]) || null,
          } satisfies Insertable<Transactions>),
      );

      let upsertedTransactions: { categoryId: string | null; date: Date }[] =
        [];
      if (transactionsToUpsert.length) {
        upsertedTransactions = await db
          .insertInto("transactions")
          .values(transactionsToUpsert)
          .onConflict((oc) =>
            oc
              .columns(["plaid_account_id", "plaid_transaction_id"])
              .doUpdateSet({
                merchant_name: (eb) => eb.ref("excluded.merchant_name"),
                date: (eb) => eb.ref("excluded.date"),
                amount: (eb) => eb.ref("excluded.amount"),
                isReconciled: (eb) => eb.ref("excluded.isReconciled"),
              }),
          )
          .returning(["categoryId", "date"])
          .execute();
      }

      await db
        .updateTable("plaid_accounts")
        .set({ next_cursor: response.next_cursor })
        .where("account_id", "=", accountId)
        .execute();

      // update account and partial balances
      await updateAccountAndMonthlyBalances(db, budgetId, accountId, [
        ...upsertedTransactions,
        ...deletedTransactions,
      ]);
    });
  };

  export const syncAccountTransactions = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
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
        include_original_description: true,
      },
      cursor: account.next_cursor || undefined,
    };

    const response = await client.transactionsSync(request);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to sync transactions for account ${account.id}`);
    }

    await handleTransactionsResponse(db, budgetId, accountId, response.data);

    if (response.data.has_more) {
      console.log("Calling syncTransactions again");
      await syncAccountTransactions(db, budgetId, accountId);
    }
  };

  export const syncItemTransactions = async (
    db: Kysely<DB>,
    itemId: string,
  ) => {
    const accountsToSync = await db
      .selectFrom("plaid_accounts")
      .where("plaid_item_id", "=", itemId)
      .select(["account_id", "budget_id"])
      .execute();

    if (!accountsToSync.length) return;

    for (const { account_id, budget_id } of accountsToSync) {
      account_id && (await syncAccountTransactions(db, budget_id, account_id));
    }
  };
}
