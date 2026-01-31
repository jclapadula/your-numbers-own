import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { plaidWebhookService } from "../../services/plaidWebhookService";
import { json } from "express";

interface PlaidWebhookPayload {
  webhook_type: "TRANSACTIONS" | "ITEM";
  webhook_code: string;
  item_id: string;
}

export const plaidWebhookRouter = Router();

// Webhook endpoint (no authentication required for webhooks)
plaidWebhookRouter.post(
  "/api/plaid/webhook",
  json({ type: "text" }), // Get raw body for signature verification
  async (req: Request<{}, {}, PlaidWebhookPayload>, res: Response) => {
    try {
      const isValid = await plaidWebhookService.verifyWebhookSignature(
        req.rawBody,
        req.headers,
      );
      if (!isValid) {
        console.warn("Invalid webhook signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const { webhook_type, webhook_code, item_id } = req.body;

      console.log(`Received Plaid webhook: ${webhook_type} - ${webhook_code}`);

      switch (webhook_type) {
        case "TRANSACTIONS":
          await plaidWebhookService.handleTransactionsWebhook(
            db,
            item_id,
            webhook_code,
          );
          break;
        case "ITEM":
          await plaidWebhookService.handleItemWebhook(
            db,
            item_id,
            webhook_code,
          );
          break;
        default:
          console.log(`Unhandled webhook type: ${webhook_type}`);
          // For unsupported webhook types, just acknowledge receipt
          break;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);
