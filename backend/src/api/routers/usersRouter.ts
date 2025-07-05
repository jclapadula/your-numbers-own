import { Router } from "express";
import { db } from "../../db";
import { authenticate } from "../middlewares";
import { userService } from "../../services/userService";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.post("/users/me", async (req, res) => {
  const { sub, email } = req.auth!.payload as { sub: string; email: string };

  const userBudget = await db.transaction().execute(async (db) => {
    return await userService.ensureUser(db, sub, email);
  });

  res.status(200).send({
    budgetId: userBudget.id,
    timezone: userBudget.timezone,
  });
});
