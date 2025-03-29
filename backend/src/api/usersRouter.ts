import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";

export const usersRouter = Router();

usersRouter.get("/", async (req: Request, res: Response) => {
  const users = await db.selectFrom("users").selectAll().execute();
  res.json({ users });
});

usersRouter.post("/", async (req, res) => {
  const user = await db
    .insertInto("users")
    .values({
      name: "juan",
      email: "juan@gmail.com",
    })
    .executeTakeFirst();
  res.json(user);
});
