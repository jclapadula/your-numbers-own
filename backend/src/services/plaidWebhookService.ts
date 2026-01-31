import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import type { WebhookVerificationKeyGetRequest } from "plaid";
import type { Kysely } from "kysely";
import type { DB } from "../db/models";
// @ts-ignore
import compare from "secure-compare";
import { jwtDecode } from "jwt-decode";
import * as JWT from "jose";
import { sha256 } from "js-sha256";
import type { IncomingHttpHeaders } from "http";
import { plaidTransactionSyncService } from "./plaidTransactionSyncService";

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

  const getConnectedAccountsForItem = async (
    db: Kysely<DB>,
    itemId: string,
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
    webhookCode: string,
  ) => {
    console.log(
      `Processing TRANSACTIONS webhook - ${webhookCode} for item: ${itemId}`,
    );
    if (webhookCode === "SYNC_UPDATES_AVAILABLE") return;

    await plaidTransactionSyncService.syncItemTransactions(db, itemId);
  };

  export const handleItemWebhook = async (
    db: Kysely<DB>,
    itemId: string,
    webhookCode: string,
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
    headers: IncomingHttpHeaders,
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
