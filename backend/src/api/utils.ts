import type { Request } from "express";
import type { UserRow } from "../services/authService";

export const getAuthenticatedUser = async (req: Request): Promise<UserRow> => {
  if (!req.user) {
    throw new Error("User not authenticated");
  }

  const user = req.user as UserRow;
  return user;
};
