import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import { categoryInitService } from "./categoryInitService";

export namespace userService {
  export const ensureUser = async (
    db: Kysely<DB>,
    externalId: string,
    email: string
  ) => {
    let existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("externalId", "=", externalId)
      .executeTakeFirst();

    if (!existingUser) {
      existingUser = await db
        .insertInto("users")
        .values({
          email,
          externalId: externalId,
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

      await categoryInitService.createInitialCategories(db, userBudget.id);
    }

    return userBudget;
  };
}
