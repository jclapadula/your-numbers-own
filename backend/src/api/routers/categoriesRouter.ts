import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type { Category } from "../../services/models";

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);
categoriesRouter.use(authorizeRequest);

categoriesRouter.get(
  "/budgets/:budgetId/categories",
  async (req: Request<{ budgetId: string }>, res: Response<Category[]>) => {
    const categories = await db
      .selectFrom("categories")
      .where("budgetId", "=", req.params.budgetId)
      .select(["id", "name"])
      .execute();

    res.json(categories);
  }
);

categoriesRouter.post(
  "/budgets/:budgetId/categories",
  async (
    req: Request<{ budgetId: string }, any, { name: string }>,
    res: Response
  ) => {
    const { name } = req.body;

    await db
      .insertInto("categories")
      .values({ name, budgetId: req.params.budgetId })
      .execute();

    res.status(200).send({});
  }
);

categoriesRouter.put(
  "/budgets/:budgetId/categories/:categoryId",
  async (
    req: Request<
      { budgetId: string; categoryId: string },
      any,
      { name: string }
    >,
    res: Response
  ) => {
    const { categoryId = "" } = req.params;
    const { name } = req.body;

    await db
      .updateTable("categories")
      .set({ name })
      .where("id", "=", categoryId)
      .execute();

    res.status(200).send({});
  }
);

categoriesRouter.delete(
  "/budgets/:budgetId/categories/:categoryId",
  async (
    req: Request<{ budgetId: string; categoryId: string }>,
    res: Response
  ) => {
    const { categoryId = "" } = req.params;

    await db.deleteFrom("categories").where("id", "=", categoryId).execute();

    res.status(200).send({});
  }
);
