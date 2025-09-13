import type { Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { getAuthenticatedUser } from "./utils";
import { db } from "../db";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  res.status(500).send("Something went wrong!");
  next(err);
};

export const authenticate = auth({
  audience: "https://api.your-numbers.app",
  issuerBaseURL: `https://your-numbers.eu.auth0.com/`,
  authRequired: true,
});

export const routerLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

type AuthorizeRequestParams = {
  budgetId?: string;
  accountId?: string;
  categoryId?: string;
  categoryGroupId?: string;
};

export const authorizeRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await getAuthenticatedUser(req);

  const params: AuthorizeRequestParams = req.params;

  if (params.budgetId) {
    const { count } = await db
      .selectFrom("budgets")
      .select(db.fn.countAll().as("count"))
      .where("id", "=", params.budgetId)
      .where("ownerId", "=", user.id)
      .executeTakeFirstOrThrow();

    if (count === 0) {
      throw new Error("Budget file not found");
    }
  }

  if (params.accountId) {
    const { count } = await db
      .selectFrom("accounts")
      .select(db.fn.countAll().as("count"))
      .where("id", "=", params.accountId)
      .where("budgetId", "=", params.budgetId || "")
      .executeTakeFirstOrThrow();

    if (count === 0) {
      throw new Error("Account not found");
    }
  }

  if (params.categoryGroupId) {
    const { count } = await db
      .selectFrom("category_groups")
      .select(db.fn.countAll().as("count"))
      .where("id", "=", params.categoryGroupId)
      .where("budgetId", "=", params.budgetId || "")
      .executeTakeFirstOrThrow();

    if (count === 0) {
      throw new Error("Category group not found");
    }
  }

  if (params.categoryId && params.categoryId !== "null") {
    const { count } = await db
      .selectFrom("categories")
      .select(db.fn.countAll().as("count"))
      .where("id", "=", params.categoryId)
      .where("budgetId", "=", params.budgetId || "")
      .executeTakeFirstOrThrow();

    if (count === 0) {
      throw new Error("Category not found");
    }
  }

  next();
};
