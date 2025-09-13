import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import { plaidService } from "../../services/plaidService";
import { getAuthenticatedUser } from "../utils";
import type {
  PlaidAccountSubtype,
  PlaidAccountType,
  PlaidExchangeTokenRequest,
  PlaidExchangeTokenResponse,
} from "../../services/models";

export const plaidRouter = Router();

plaidRouter.use(authenticate);
plaidRouter.use(authorizeRequest);

// Create link token for Plaid Link initialization
plaidRouter.post("/plaid/link-token", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    const linkToken = await plaidService.createLinkToken(user.id);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error("Error creating link token:", error);
    res.status(500).json({ error: "Failed to create link token" });
  }
});

plaidRouter.post(
  "/budgets/:budgetId/plaid/exchange-token",
  async (
    req: Request<{ budgetId: string }, {}, PlaidExchangeTokenRequest>,
    res: Response
  ) => {
    try {
      const { publicToken: public_token } = req.body;
      const { budgetId } = req.params;

      if (!public_token) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const { accessToken, itemId } = await plaidService.exchangePublicToken(
        public_token
      );

      const plaidAccounts = await plaidService.getAccounts(accessToken);

      if (plaidAccounts.length === 0) {
        res.status(400).json({ error: "No accounts found" });
        return;
      }

      await plaidService.saveLinkedAccounts(db, budgetId, plaidAccounts, {
        accessToken,
        itemId,
      });

      const availableAccounts = plaidAccounts.map((plaidAccount) => ({
        plaid_account_id: plaidAccount.account_id,
        account_name: plaidAccount.name,
        account_type: plaidAccount.type as unknown as PlaidAccountType,
        account_subtype: plaidAccount.subtype as PlaidAccountSubtype | null,
      }));

      res.json({
        availableAccounts,
      } satisfies PlaidExchangeTokenResponse);
    } catch (error) {
      console.error("Error linking account:", error);
      res.status(500).json({ error: "Failed to link account" });
    }
  }
);

// Get linked Plaid accounts for a budget
plaidRouter.get(
  "/budgets/:budgetId/plaid/accounts",
  async (req: Request<{ budgetId: string }>, res: Response) => {
    try {
      const { budgetId } = req.params;
      const plaidAccounts = await plaidService.getAllPlaidAccounts(
        db,
        budgetId
      );
      res.json({ accounts: plaidAccounts });
    } catch (error) {
      console.error("Error fetching Plaid accounts:", error);
      res.status(500).json({ error: "Failed to fetch Plaid accounts" });
    }
  }
);

// Manual sync endpoint (for testing or manual refresh)
plaidRouter.post(
  "/budgets/:budgetId/accounts/:accountId/plaid/sync",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response
  ) => {
    try {
      const { accountId } = req.params;
      const { start_date, end_date } = req.body;

      // Get Plaid account info
      const plaidAccount = await plaidService.getPlaidAccountByAccountId(
        db,
        accountId
      );
      if (!plaidAccount) {
        res.status(404).json({ error: "Plaid account not found" });
        return;
      }

      // Default to last 30 days if dates not provided
      const endDate = end_date || new Date().toISOString().split("T")[0];
      const startDate =
        start_date ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

      // Process webhook to sync the transactions
      await plaidService.handleTransactionsWebhook(
        db,
        plaidAccount.plaid_item_id,
        "DEFAULT_UPDATE"
      );

      res.json({
        success: true,
        message: "Transaction sync completed",
        date_range: { start_date: startDate, end_date: endDate },
      });
    } catch (error) {
      console.error("Error syncing transactions:", error);
      res.status(500).json({ error: "Failed to sync transactions" });
    }
  }
);
