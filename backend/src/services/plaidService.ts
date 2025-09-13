import {
  PlaidApi,
  Configuration,
  PlaidEnvironments,
  CountryCode,
  Products,
} from "plaid";
import type {
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  AccountBase as PlaidAccount,
} from "plaid";
import type { Kysely } from "kysely";
import type { DB } from "../db/models";

export namespace plaidService {
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

  export const createLinkToken = async (userId: string) => {
    const client = initializePlaidClient();

    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: "Your Numbers",
      products: [Products.Transactions],
      country_codes: [CountryCode.Es, CountryCode.De], // EU countries supported by Plaid
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
      .execute();
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

  export const getAllPlaidAccounts = async (
    db: Kysely<DB>,
    budgetId: string
  ) => {
    return await db
      .selectFrom("plaid_accounts")
      .selectAll()
      .where("budget_id", "=", budgetId)
      .execute();
  };
}
