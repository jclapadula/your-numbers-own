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
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
};

export const authenticate = auth({
  audience: "https://api.your-numbers.app",
  issuerBaseURL: `https://your-numbers.eu.auth0.com/`,
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
      .selectFrom("budget")
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

  next();
};
