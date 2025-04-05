import type { NextFunction, Request } from "express";
import { db } from "../db";

const getExternalUserId = (req: Request) => {
  return req.auth?.payload.sub;
};

export const getAuthenticatedUser = async (req: Request) => {
  const externalUserId = getExternalUserId(req);

  if (!externalUserId) {
    throw new Error("User not authenticated");
  }

  const user = await db
    .selectFrom("users")
    .where("externalId", "=", externalUserId)
    .selectAll()
    .executeTakeFirst();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
