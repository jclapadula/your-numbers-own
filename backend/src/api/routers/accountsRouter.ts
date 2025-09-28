import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import { getAuthenticatedUser } from "../utils";
import type { CreateAccount, BudgetAccount } from "../../services/models";
import { accountBalanceService } from "../../services/accountBalanceService";

export const accountsRouter = Router();

accountsRouter.use(authenticate);
accountsRouter.use(authorizeRequest);

accountsRouter.get(
  "/budgets/:budgetId/accounts",
  async (req: Request<{ budgetId: string }>, res: Response) => {
    const accounts = await db
      .selectFrom("accounts")
      .where("budgetId", "=", req.params.budgetId)
      .where("deletedAt", "is", null)
      .selectAll()
      .execute();

    const accountsIds = accounts.map((a) => a.id);

    const balances = await accountBalanceService.getAccountsBalances(
      accountsIds
    );

    const accountsResponse: BudgetAccount[] = accounts.map((a) => ({
      id: a.id,
      name: a.name,
      balance: balances.find((b) => b.accountId === a.id)?.balance ?? 0,
    }));

    res.json(accountsResponse);
  }
);

accountsRouter.post(
  "/budgets/:budgetId/accounts",
  async (req: Request<{ budgetId: string }>, res: Response) => {
    const user = await getAuthenticatedUser(req);

    const { name } = req.body as CreateAccount;

    await db
      .insertInto("accounts")
      .values({ name, budgetId: req.params.budgetId })
      .execute();

    res.status(200).send({});
  }
);

accountsRouter.put(
  "/budgets/:budgetId/accounts/:accountId",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response
  ) => {
    const user = await getAuthenticatedUser(req);
    const { accountId = "" } = req.params;
    const { name } = req.body as CreateAccount;

    await db
      .updateTable("accounts")
      .set({ name })
      .where("id", "=", accountId)
      .where("budgetId", "=", req.params.budgetId)
      .execute();

    res.status(200).send({});
  }
);

accountsRouter.delete(
  "/budgets/:budgetId/accounts/:accountId",
  async (
    req: Request<{ budgetId: string; accountId: string }>,
    res: Response
  ) => {
    const { accountId = "" } = req.params;

    await db.transaction().execute(async (db) => {
      await db
        .updateTable("accounts")
        .set({ deletedAt: new Date() })
        .where("id", "=", accountId)
        .where("budgetId", "=", req.params.budgetId)
        .where("deletedAt", "is", null)
        .execute();

      // Recalculate all budget balances after account deletion
      await accountBalanceService.recalculateAllBudgetBalancesAfterDelete(
        db,
        req.params.budgetId
      );
    });

    res.status(200).send({});
  }
);
