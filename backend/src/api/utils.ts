import type { Request } from "express";
import { db } from "../db";

export const getAuthenticatedUser = async (req: Request) => {
  if (!req.auth?.payload.sub) {
    throw new Error("User not authenticated");
  }

  const userId = req.auth?.payload.sub;
  const user = await db
    .selectFrom("users")
    .where("externalId", "=", userId)
    .selectAll()
    .executeTakeFirst();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
