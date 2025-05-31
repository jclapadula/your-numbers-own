import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate, authorizeRequest } from "../middlewares";
import type { MonthOfYear } from "../../services/models";
import { isValidMonthOfYear } from "../../services/utils";

export const monthlyBudgetsRouter = Router();

monthlyBudgetsRouter.use(authenticate);
monthlyBudgetsRouter.use(authorizeRequest);

monthlyBudgetsRouter.get(
  "/budgets/:budgetId/monthly-budget",
  async (
    req: Request<{ budgetId: string }, any, any, MonthOfYear>,
    res: Response
  ) => {
    if (!isValidMonthOfYear(req.query)) {
      res.status(400).json({ error: "Invalid month of year" });
      return;
    }

    // const transactions = await db
    //   .selectFrom("transactions")
    //   .where("accountId", "=", req.params.accountId)
    //   .orderBy("date", "desc")
    //   .selectAll()
    //   .execute();

    res.json(transactions);
  }
);
