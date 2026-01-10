import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import type {
  TransactionsGetRequest,
  Transaction as PlaidTransaction,
  WebhookVerificationKeyGetRequest,
} from "plaid";
import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import type { CreateTransaction } from "./models";
import { transactionsService } from "./transactionsService";
// @ts-ignore
import compare from "secure-compare";
import { jwtDecode } from "jwt-decode";
import * as JWT from "jose";
import { sha256 } from "js-sha256";
import type { IncomingHttpHeaders } from "http";

export namespace plaidWebhookService {
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

  const getTransactions = async (
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
        destinationAccountId: null,
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
      account.account_id &&
        (await syncTransactionsForAccount(
          db,
          account.budget_id,
          account.account_id,
          account.plaid_account_id,
          plaidTransactions.filter(
            (tx) => tx.account_id === account.plaid_account_id
          )
        ));
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

  // Single cached key instead of a Map
  let cachedKey: any = null;

  export const verifyWebhookSignature = async (
    body: string,
    headers: IncomingHttpHeaders
  ): Promise<boolean> => {
    try {
      const signedJwt = headers["plaid-verification"] as string;
      const decodedToken = jwtDecode(signedJwt);
      const decodedTokenHeader = jwtDecode(signedJwt, { header: true });
      const currentKeyID = decodedTokenHeader.kid;

      if (!cachedKey) {
        const client = initializePlaidClient();
        const request: WebhookVerificationKeyGetRequest = {
          key_id: currentKeyID || "",
        };
        const response = await client.webhookVerificationKeyGet(request);
        cachedKey = response.data.key;
      }

      const keyLike = await JWT.importJWK(cachedKey);
      await JWT.jwtVerify(signedJwt, keyLike, {
        maxTokenAge: "5 min",
      });

      // Compare hashes
      const bodyHash = sha256(body);
      const claimedBodyHash = (decodedToken as any).request_body_sha256;
      console.log({ body, bodyHash, claimedBodyHash });
      return compare(bodyHash, claimedBodyHash);
    } catch (error) {
      console.error(`Webhook signature verification failed:${error}`);
      return false;
    }
  };
}
