import { Router } from "express";
import { accountsRouter } from "./routers/accountsRouter";
import { usersRouter } from "./routers/usersRouter";
import bodyParser from "body-parser";
import { transactionsRouter } from "./routers/transactionsRouter";

export const mainRouter = Router();

mainRouter.use(bodyParser.json());

mainRouter.use(usersRouter);
mainRouter.use(accountsRouter);
mainRouter.use(transactionsRouter);
