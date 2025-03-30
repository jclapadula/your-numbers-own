import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { authenticate } from "./middlewares";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.post("/me", async (req, res) => {
  const { sub, email } = req.auth!.payload as { sub: string; email: string };

  const existingUser = await db
    .selectFrom("users")
    .where("externalId", "=", sub)
    .executeTakeFirst();

  if (!existingUser) {
    await db
      .insertInto("users")
      .values({
        email,
        externalId: sub,
      })
      .executeTakeFirst();
  }

  res.status(204).send();
});
