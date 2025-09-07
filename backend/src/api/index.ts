import { Router } from "express";
import { accountsRouter } from "./routers/accountsRouter";
import { usersRouter } from "./routers/usersRouter";
import bodyParser from "body-parser";
import { transactionsRouter } from "./routers/transactionsRouter";
import { budgetRouter } from "./routers/budgetRouter";
import { monthlyBudgetsRouter } from "./routers/monthlyBudgetRouter";
import { categoriesRouter } from "./routers/categoriesRouter";
import { plaidRouter } from "./routers/plaidRouter";
import { plaidWebhookRouter } from "./routers/plaidWebhookRouter";
export const mainRouter = Router();

mainRouter.use(bodyParser.json());

mainRouter.use(usersRouter);
mainRouter.use(accountsRouter);
mainRouter.use(transactionsRouter);
mainRouter.use(budgetRouter);
mainRouter.use(monthlyBudgetsRouter);
mainRouter.use(categoriesRouter);
mainRouter.use(plaidRouter);
mainRouter.use(plaidWebhookRouter);
