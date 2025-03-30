import { Router } from "express";
import { accountsRouter } from "./accountsRouter";
import { usersRouter } from "./usersRouter";

export const mainRouter = Router();

mainRouter.use("/accounts", accountsRouter);
mainRouter.use("/users", usersRouter);
