import { Router } from "express";
import { accountsRouter } from "./accountsRouter";
import { usersRouter } from "./usersRouter";
import bodyParser from "body-parser";

export const mainRouter = Router();

mainRouter.use(bodyParser.json());

mainRouter.use("/accounts", accountsRouter);
mainRouter.use("/users", usersRouter);
