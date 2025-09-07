import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { plaidService } from "../../services/plaidService";
import { json } from "express";

export const plaidWebhookRouter = Router();

// Webhook endpoint (no authentication required for webhooks)
plaidWebhookRouter.post(
  "/plaid/webhook",
  json({ type: "text" }), // Get raw body for signature verification
  async (req: Request, res: Response) => {
    try {
      const signature = req.get("plaid-verification") || "";
      const rawBody = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = await plaidService.verifyWebhookSignature(
        rawBody,
        signature
      );
      if (!isValid) {
        console.log("Invalid webhook signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const { webhook_type, webhook_code, item_id } = req.body;

      console.log(`Received Plaid webhook: ${webhook_type} - ${webhook_code}`);

      // Process the webhook based on type
      switch (webhook_type) {
        case "TRANSACTIONS":
          await plaidService.handleTransactionsWebhook(db, item_id, webhook_code);
          break;
        case "ITEM":
          await plaidService.handleItemWebhook(db, item_id, webhook_code);
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
  }
);
