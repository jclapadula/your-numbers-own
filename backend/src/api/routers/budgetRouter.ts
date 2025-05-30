import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";

export const budgetRouter = Router();

budgetRouter.use(authenticate);
budgetRouter.use(authorizeRequest);

budgetRouter.get(
  "/budgets/:budgetId/payees",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response
  ) => {
    const payees = await db
      .selectFrom("payees")
      .where("budgetId", "=", req.params.budgetId)
      .orderBy("name", "asc")
      .selectAll()
      .execute();

    res.json(payees.map((p) => ({ id: p.id, name: p.name })));
  }
);

budgetRouter.post(
  "/budgets/:budgetId/payees",
  async (
    req: Request<{ budgetId: string }, {}, { name: string }>,
    res: Response
  ) => {
    const { name } = req.body;

    const payee = await db
      .insertInto("payees")
      .values({ budgetId: req.params.budgetId, name })
      .returningAll()
      .executeTakeFirstOrThrow();

    res.json({ id: payee.id, name: payee.name });
  }
);
