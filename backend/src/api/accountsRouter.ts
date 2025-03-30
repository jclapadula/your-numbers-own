import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { authenticate } from "./middlewares";

export const accountsRouter = Router();

accountsRouter.use(authenticate);

accountsRouter.get("/", async (req: Request, res: Response) => {
  res.json([{ name: "Revolut", balance: 104700 }]);
});
