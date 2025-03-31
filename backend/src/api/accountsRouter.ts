import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { authenticate } from "./middlewares";
import { getAuthenticatedUser } from "./utils";
import type {
  CreateAccount,
  BudgetAccount,
} from "../services/models/accountsModels";

export const accountsRouter = Router();

accountsRouter.use(authenticate);

accountsRouter.get("/", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);

  const accounts = await db
    .selectFrom("accounts")
    .where("userId", "=", user.id)
    .selectAll()
    .execute();

  const accountsResponse: BudgetAccount[] = accounts.map((a) => ({
    id: a.id,
    name: a.name,
  }));

  res.json(accountsResponse);
});

accountsRouter.post("/", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  console.log(req.body);
  const { name } = req.body as CreateAccount;

  await db.insertInto("accounts").values({ name, userId: user.id }).execute();

  res.status(200).send({});
});

accountsRouter.put("/:id", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  const { id = "" } = req.params;
  const { name } = req.body as CreateAccount;

  await db
    .updateTable("accounts")
    .set({ name })
    .where("id", "=", id)
    .where("userId", "=", user.id)
    .execute();

  res.status(200).send({});
});

accountsRouter.delete("/:id", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  const { id = "" } = req.params;

  await db
    .deleteFrom("accounts")
    .where("id", "=", id)
    .where("userId", "=", user.id)
    .execute();

  res.status(200).send({});
});
