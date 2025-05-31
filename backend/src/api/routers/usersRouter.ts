import { Router } from "express";
import { db } from "../../db";
import { authenticate } from "../middlewares";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.post("/users/me", async (req, res) => {
  const { sub, email } = req.auth!.payload as { sub: string; email: string };

  let existingUser = await db
    .selectFrom("users")
    .select("id")
    .where("externalId", "=", sub)
    .executeTakeFirst();

  if (!existingUser) {
    existingUser = await db
      .insertInto("users")
      .values({
        email,
        externalId: sub,
      })
      .returning("id")
      .executeTakeFirstOrThrow();
  }

  let userBudget = await db
    .selectFrom("budgets")
    .select(["id", "timezone"])
    .where("ownerId", "=", existingUser.id)
    .executeTakeFirst();

  if (!userBudget) {
    userBudget = await db
      .insertInto("budgets")
      .values({ name: "My Budget", ownerId: existingUser.id })
      .returning(["id", "timezone"])
      .executeTakeFirstOrThrow();
  }

  res.status(200).send({
    budgetId: userBudget.id,
    timezone: userBudget.timezone,
  });
});
