import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate, authorizeRequest } from "../middlewares";
import type { MonthOfYear } from "../../services/models";
import { isValidMonthOfYear } from "../../services/utils";
import { monthlyBudgetService } from "../../services/monthlyBudgetService";

export const monthlyBudgetsRouter = Router();

monthlyBudgetsRouter.use(authenticate);
monthlyBudgetsRouter.use(authorizeRequest);

monthlyBudgetsRouter.get(
  "/budgets/:budgetId/monthly-budget",
  async (
    req: Request<{ budgetId: string }, any, any, MonthOfYear>,
    res: Response
  ) => {
    const monthOfYear = req.query;
    if (!isValidMonthOfYear(monthOfYear)) {
      res.status(400).json({ error: "Invalid month of year" });
      return;
    }

    const monthlyBudgets = await monthlyBudgetService.getMonthlyBudget(
      req.params.budgetId,
      monthOfYear
    );

    res.json(monthlyBudgets);
  }
);
