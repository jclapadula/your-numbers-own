import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate, authorizeRequest } from "../middlewares";
import type { MonthOfYear } from "../../services/models";
import { isValidMonthOfYear } from "../../services/utils";
import { monthlyBudgetService } from "../../services/monthlyBudgetService";
import { db } from "../../db";

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

monthlyBudgetsRouter.put(
  "/budgets/:budgetId/monthly-budget/:categoryId",
  async (
    req: Request<
      { budgetId: string; categoryId: string },
      any,
      { assignedAmount: number },
      MonthOfYear
    >,
    res: Response
  ) => {
    let { budgetId } = req.params;
    const categoryId =
      req.params.categoryId === "null" ? null : req.params.categoryId;
    const monthOfYear = req.query;

    if (!isValidMonthOfYear(monthOfYear)) {
      res.status(400).json({ error: "Invalid month of year" });
      return;
    }

    await db
      .insertInto("monthly_category_budgets")
      .values({
        assignedAmount: req.body.assignedAmount,
        budgetId,
        categoryId,
        year: monthOfYear.year,
        month: monthOfYear.month,
      })
      .onConflict((oc) =>
        oc.columns(["budgetId", "categoryId", "year", "month"]).doUpdateSet({
          assignedAmount: req.body.assignedAmount,
        })
      )
      .execute();

    res.status(200).json({});
  }
);
