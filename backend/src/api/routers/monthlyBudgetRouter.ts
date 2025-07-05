import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate, authorizeRequest } from "../middlewares";
import type { MonthOfYear } from "../../services/models";
import { isValidMonthOfYear } from "../../services/utils";
import { monthlyBudgetService } from "../../services/monthlyBudgetService";
import { db } from "../../db";
import { toZonedDate } from "../../services/ZonedDate";
import { budgetsService } from "../../services/budgetsService";
import { parseMonthOfYear } from "../../services/MonthOfYear";

export const monthlyBudgetsRouter = Router();

monthlyBudgetsRouter.use(authenticate);
monthlyBudgetsRouter.use(authorizeRequest);

monthlyBudgetsRouter.get(
  "/budgets/:budgetId/monthly-budget",
  async (
    req: Request<{ budgetId: string }, any, any, MonthOfYear>,
    res: Response
  ) => {
    const monthOfYear = parseMonthOfYear(req.query);
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
    const monthOfYear = parseMonthOfYear(req.query);

    if (!isValidMonthOfYear(monthOfYear)) {
      res.status(400).json({ error: "Invalid month of year" });
      return;
    }

    const timezone = await budgetsService.getBudgetTimezone(
      req.params.budgetId
    );

    await db.transaction().execute(async (db) => {
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

      const date = toZonedDate(
        new Date(monthOfYear.year, monthOfYear.month - 1, 3),
        timezone
      );
      await monthlyBudgetService.updateMonthlyBudgets(db, budgetId, [
        {
          date,
          categories: [categoryId],
        },
      ]);
    });

    res.status(200).json({});
  }
);
