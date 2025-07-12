import type { Kysely } from "kysely";
import type { DB } from "../db/models";

export namespace categoryGroupsService {
  export const deleteCategoryGroup = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryGroupId: string,
    moveToGroupId: string
  ) => {
    const categoryGroup = await db
      .selectFrom("category_groups")
      .where("id", "=", categoryGroupId)
      .select("isIncome")
      .executeTakeFirst();

    if (categoryGroup?.isIncome) {
      throw new Error("Income category group can't be deleted");
    }

    await db.transaction().execute(async (db) => {
      const assignedCategories = await db
        .selectFrom("categories")
        .where("budgetId", "=", budgetId)
        .where("groupId", "=", categoryGroupId)
        .select("id")
        .execute();

      if (assignedCategories.length > 0 && !moveToGroupId) {
        throw new Error(
          "Category group is not empty. Please select a category to move the categories to."
        );
      }

      if (moveToGroupId) {
        const highestPosition = await db
          .selectFrom("categories")
          .where("budgetId", "=", budgetId)
          .where("groupId", "=", moveToGroupId)
          .select("position")
          .orderBy("position", "asc")
          .executeTakeFirst();
        const nextPosition =
          highestPosition?.position !== undefined
            ? highestPosition.position + 1
            : 0;

        const categoriesToUpdate = assignedCategories.map(
          (category, index) => ({
            id: category.id,
            newPosition: nextPosition + index,
          })
        );

        for (const category of categoriesToUpdate) {
          await db
            .updateTable("categories")
            .set({ groupId: moveToGroupId, position: category.newPosition })
            .where("id", "=", category.id)
            .execute();
        }
      }

      await db
        .deleteFrom("category_groups")
        .where("id", "=", categoryGroupId)
        .execute();
    });
  };
}
