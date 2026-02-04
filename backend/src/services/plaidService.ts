import type { Kysely } from "kysely";
import type {
  AccountsGetRequest,
  ItemPublicTokenExchangeRequest,
  ItemRemoveRequest,
  LinkTokenCreateRequest,
  AccountBase as PlaidAccount,
} from "plaid";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";
import type { DB } from "../db/models";
import { plaidTransactionSyncService } from "./plaidTransactionSyncService";

export namespace plaidService {
  let plaidClient: PlaidApi;

  const initializePlaidClient = () => {
    if (!plaidClient) {
      const environment =
        process.env.NODE_ENV === "production"
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

  export const createLinkToken = async (userId: string) => {
    const client = initializePlaidClient();

    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: "Your Numbers",
      products: [Products.Transactions],
      country_codes: [CountryCode.Es],
      language: "en",
      webhook: process.env.PLAID_WEBHOOK_URL, // Your webhook endpoint
    };

    const response = await client.linkTokenCreate(request);
    return response.data.link_token;
  };

  export const exchangePublicToken = async (publicToken: string) => {
    const client = initializePlaidClient();

    const request: ItemPublicTokenExchangeRequest = {
      public_token: publicToken,
    };

    const response = await client.itemPublicTokenExchange(request);
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  };

  export const saveLinkedAccounts = async (
    db: Kysely<DB>,
    budgetId: string,
    plaidAccounts: PlaidAccount[],
    { accessToken, itemId }: { accessToken: string; itemId: string }
  ) => {
    await db
      .insertInto("plaid_accounts")
      .values(
        plaidAccounts.map((plaidAccount) => ({
          budget_id: budgetId,
          account_id: null,
          plaid_account_id: plaidAccount.account_id,
          plaid_item_id: itemId,
          access_token: accessToken,
          account_name: plaidAccount.name,
          account_type: plaidAccount.type,
          account_subtype: plaidAccount.subtype,
        }))
      )
      .onConflict((oc) =>
        oc.columns(["plaid_account_id", "budget_id"]).doUpdateSet({
          plaid_item_id: (eb) => eb.ref("excluded.plaid_item_id"),
          access_token: (eb) => eb.ref("excluded.access_token"),
          account_name: (eb) => eb.ref("excluded.account_name"),
          account_type: (eb) => eb.ref("excluded.account_type"),
          account_subtype: (eb) => eb.ref("excluded.account_subtype"),
        })
      )
      .execute();
  };

  export const connectPlaidAccounts = async (
    db: Kysely<DB>,
    budgetId: string,
    plaidAccountIds: string[]
  ) => {
    const accountsToConnect = await db
      .selectFrom("plaid_accounts")
      .where("plaid_account_id", "in", plaidAccountIds)
      .where("budget_id", "=", budgetId)
      .selectAll()
      .execute();

    if (accountsToConnect.length === 0) {
      throw new Error("No accounts to connect");
    }

    const createdAccounts: string[] = [];

    for (const account of accountsToConnect) {
      await db.transaction().execute(async (db) => {
        const { id: createdAccountId } = await db
          .insertInto("accounts")
          .values({
            budgetId: budgetId,
            name: account.account_name,
          })
          .returning(["id"])
          .executeTakeFirstOrThrow();

        await db
          .updateTable("plaid_accounts")
          .set({
            account_id: createdAccountId,
          })
          .where("id", "=", account.id)
          .where("budget_id", "=", budgetId)
          .execute();

        createdAccounts.push(createdAccountId);
      });
    }

    createdAccounts.forEach((accountId) => {
      plaidTransactionSyncService.syncAccountTransactions(
        db,
        budgetId,
        accountId
      );
    });

    return createdAccounts;
  };

  export const getAccounts = async (
    accessToken: string
  ): Promise<PlaidAccount[]> => {
    const client = initializePlaidClient();

    const request: AccountsGetRequest = {
      access_token: accessToken,
    };

    const response = await client.accountsGet(request);
    return response.data.accounts;
  };

  export const getPlaidAccountByAccountId = async (
    db: Kysely<DB>,
    accountId: string
  ) => {
    return await db
      .selectFrom("plaid_accounts")
      .selectAll()
      .where("account_id", "=", accountId)
      .executeTakeFirst();
  };

  export const removeItem = async (accessToken: string) => {
    const client = initializePlaidClient();

    const request: ItemRemoveRequest = {
      access_token: accessToken,
    };

    await client.itemRemove(request);
  };
}
