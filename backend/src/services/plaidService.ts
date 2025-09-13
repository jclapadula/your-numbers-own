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
  TransactionsGetRequest,
  AccountsGetRequest,
  Transaction as PlaidTransaction,
  AccountBase as PlaidAccount,
  WebhookVerificationKeyGetRequest,
} from "plaid";
import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import type { CreateTransaction } from "./models";
import { transactionsService } from "./transactionsService";
import crypto from "crypto";

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

  export const getTransactions = async (
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<PlaidTransaction[]> => {
    const client = initializePlaidClient();

    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    };

    const response = await client.transactionsGet(request);
    return response.data.transactions;
  };

  export const linkPlaidAccount = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    accessToken: string,
    plaidAccount: PlaidAccount,
    itemId: string
  ) => {
    await db
      .insertInto("plaid_accounts")
      .values({
        budget_id: budgetId,
        account_id: accountId,
        plaid_account_id: plaidAccount.account_id,
        plaid_item_id: itemId,
        access_token: accessToken,
        institution_id: null,
        institution_name: null, // You might want to fetch institution details
        account_name: plaidAccount.name,
        account_type: plaidAccount.type,
        account_subtype: plaidAccount.subtype || null,
      })
      .execute();
  };

  const getConnectedAccountsForItem = async (
    db: Kysely<DB>,
    itemId: string
  ) => {
    const connectedAccounts = await db
      .selectFrom("plaid_accounts")
      .where("plaid_item_id", "=", itemId)
      .select(["budget_id", "account_id", "access_token", "plaid_account_id"])
      .execute();

    if (connectedAccounts.length === 0) {
      console.log("No connected accounts found for item", itemId);
      return null;
    }

    return connectedAccounts;
  };

  export const handleTransactionsWebhook = async (
    db: Kysely<DB>,
    itemId: string,
    webhookCode: string
  ) => {
    console.log(
      `Processing TRANSACTIONS webhook - ${webhookCode} for item: ${itemId}`
    );

    const connectedAccounts = await getConnectedAccountsForItem(db, itemId);
    if (!connectedAccounts) return;

    const accessToken = connectedAccounts[0]!.access_token;

    // Get transactions from the last 30 days (you can adjust this)
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const plaidTransactions = await getTransactions(
      accessToken,
      startDate!,
      endDate!
    );

    for (const account of connectedAccounts) {
      await syncTransactionsForAccount(
        db,
        account.budget_id,
        account.account_id,
        account.plaid_account_id,
        plaidTransactions.filter(
          (tx) => tx.account_id === account.plaid_account_id
        )
      );
    }
  };

  export const handleItemWebhook = async (
    db: Kysely<DB>,
    itemId: string,
    webhookCode: string
  ) => {
    console.log(`Processing ITEM webhook - ${webhookCode} for item: ${itemId}`);

    const connectedAccounts = await getConnectedAccountsForItem(db, itemId);
    if (!connectedAccounts) return;

    // Handle different ITEM webhook codes
    switch (webhookCode) {
      case "ERROR":
        console.log(`Item error for ${itemId} - may need re-authentication`);
        // TODO: Mark accounts as needing re-auth or notify user
        break;
      case "PENDING_EXPIRATION":
        console.log(`Access token expiring soon for ${itemId}`);
        // TODO: Refresh access token or notify user
        break;
      case "USER_PERMISSION_REVOKED":
        console.log(`User revoked permissions for ${itemId}`);
        // TODO: Disable/remove linked accounts
        break;
      default:
        console.log(`Unhandled ITEM webhook code: ${webhookCode}`);
    }
  };

  const syncTransactionsForAccount = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    plaidAccountId: string,
    plaidTransactions: PlaidTransaction[]
  ) => {
    for (const plaidTx of plaidTransactions) {
      // Check if we already have this transaction
      const existingTransaction = await db
        .selectFrom("transactions")
        .where("plaid_transaction_id", "=", plaidTx.transaction_id)
        .executeTakeFirst();

      if (existingTransaction) {
        continue; // Skip if already exists
      }

      // Convert Plaid transaction to Your Numbers format
      const transaction: CreateTransaction = {
        date: new Date(plaidTx.date),
        accountId,
        amount: -plaidTx.amount, // Plaid uses positive for outflows, we use negative
        categoryId: null, // Will need to be categorized manually or with auto-categorization
        isReconciled: false,
        notes: plaidTx.merchant_name || plaidTx.original_description || null,
        payeeId: null,
      };

      // Insert transaction using existing service but with Plaid metadata
      await db
        .transaction()
        .setIsolationLevel("serializable")
        .execute(async (trx) => {
          // Insert with Plaid-specific fields
          await trx
            .insertInto("transactions")
            .values({
              ...transaction,
              plaid_transaction_id: plaidTx.transaction_id,
              plaid_account_id: plaidAccountId,
              merchant_name: plaidTx.merchant_name || null,
              is_plaid_transaction: true,
            })
            .execute();

          // Use existing transaction service for balance updates
          // Note: This approach reuses the balance update logic from transactionsService
          await transactionsService.insertTransaction(
            trx,
            budgetId,
            transaction
          );
        });
    }
  };

  export const verifyWebhookSignature = async (
    requestBody: string,
    plaidSignature: string
  ): Promise<boolean> => {
    try {
      const client = initializePlaidClient();
      const signatureParts = plaidSignature.split(".");
      if (signatureParts.length !== 2) {
        return false;
      }

      const request: WebhookVerificationKeyGetRequest = {
        key_id: signatureParts[0]!,
      };

      const response = await client.webhookVerificationKeyGet(request);
      const jwk = response.data.key;

      // For webhook verification, you'll need to properly verify the JWT
      // This is a simplified version - in production you should use a proper JWT library
      const verify = crypto.createVerify("SHA256");
      verify.update(requestBody);
      verify.end();

      // Note: This is a placeholder - you'll need proper JWT verification
      return true; // Simplified for now
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
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
