import { Router } from "express";
import { db } from "../../db";
import { authenticate } from "../middlewares";
import { getAuthenticatedUser } from "../utils";
import { categoryInitService } from "../../services/categoryInitService";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.post("/users/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    let userBudget = await db
      .selectFrom("budgets")
      .select(["id", "timezone"])
      .where("ownerId", "=", user.id)
      .executeTakeFirst();

    if (!userBudget) {
      userBudget = await db.transaction().execute(async (db) => {
        const newBudget = await db
          .insertInto("budgets")
          .values({ name: "My Budget", ownerId: user.id })
          .returning(["id", "timezone"])
          .executeTakeFirstOrThrow();

        await categoryInitService.createInitialCategories(db, newBudget.id);
        return newBudget;
      });
    }

    res.status(200).send({
      budgetId: userBudget.id,
      timezone: userBudget.timezone,
    });
  } catch (error) {
    console.error("Users/me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
