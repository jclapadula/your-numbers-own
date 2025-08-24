import _ from "lodash";
import type { Kysely } from "kysely";
import type { DB } from "../db/models";
import { budgetsService } from "./budgetsService";
import { toZonedDate } from "./ZonedDate";
import { balanceUpdater } from "./balanceUpdater";

export namespace categoriesService {
  const getSortedElements = <T extends { id: string; position: number }>(
    elements: T[],
    elementId: string,
    newPosition: number
  ) => {
    // copy so we don't mutate the original array
    elements = _.sortBy(elements, (e) => e.position);
    const index = elements.findIndex((el) => el.id === elementId);

    if (index === -1) return elements;

    const [elementToMove] = elements.splice(index, 1);
    if (!elementToMove) return elements;

    const clampedPosition = Math.max(0, Math.min(newPosition, elements.length));

    // Insert the element at the new position
    elements.splice(clampedPosition, 0, elementToMove);

    return elements.map((el, idx) => ({ ...el, position: idx }));
  };

  const moveToCategoryGroup = async (
    db: Kysely<DB>,
    category: { id: string; groupId: string },
    categoryGroupId: string
  ) => {
    await db
      .updateTable("categories")
      .set({ groupId: categoryGroupId })
      .where("id", "=", category.id)
      .execute();

    const previousCategoryGroupCategories = await db
      .selectFrom("categories")
      .select(["id", "position"])
      .where("groupId", "=", category.groupId)
      .orderBy("position", "asc")
      .execute();

    const resortedCategories = previousCategoryGroupCategories.map(
      (c, idx) => ({
        ...c,
        position: idx,
      })
    );

    for (const category of resortedCategories) {
      await db
        .updateTable("categories")
        .set({ position: category.position })
        .where("id", "=", category.id)
        .execute();
    }
  };

  export const moveCategory = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryGroupId: string,
    categoryId: string,
    newPosition: number
  ) => {
    const category = await db
      .selectFrom("categories")
      .select(["id", "position", "groupId"])
      .where("budgetId", "=", budgetId)
      .where("id", "=", categoryId)
      .executeTakeFirstOrThrow();

    if (categoryGroupId !== category.groupId) {
      await moveToCategoryGroup(db, category, categoryGroupId);
    }

    const currentCategoryGroupCategories = await db
      .selectFrom("categories")
      .select(["id", "position"])
      .where("groupId", "=", categoryGroupId)
      .orderBy("position", "asc")
      .execute();

    const resortedCategories = getSortedElements(
      currentCategoryGroupCategories,
      categoryId,
      newPosition
    );

    for (const category of resortedCategories) {
      await db
        .updateTable("categories")
        .set({ position: category.position })
        .where("id", "=", category.id)
        .execute();
    }
  };

  export const moveCategoryGroup = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryGroupId: string,
    newPosition: number
  ) => {
    const allGroups = await db
      .selectFrom("category_groups")
      .select(["id", "position"])
      .where("budgetId", "=", budgetId)
      .orderBy("position", "asc")
      .execute();

    const resortedGroups = getSortedElements(
      allGroups,
      categoryGroupId,
      newPosition
    );

    for (const group of resortedGroups) {
      await db
        .updateTable("category_groups")
        .set({ position: group.position })
        .where("id", "=", group.id)
        .execute();
    }
  };

  const moveTransactionsToOtherCategory = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string,
    moveToCategoryId: string
  ) => {
    const { earliestTransactionDate } =
      (await db
        .selectFrom("transactions")
        .select((eb) => [eb.fn.min("date").as("earliestTransactionDate")])
        .where("categoryId", "=", categoryId)
        .executeTakeFirst()) || {};

    if (earliestTransactionDate && !moveToCategoryId) {
      throw new Error(
        "Category has transactions. Please select a category to move the transactions to."
      );
    }

    if (moveToCategoryId) {
      await db
        .updateTable("transactions")
        .set({ categoryId: moveToCategoryId })
        .where("categoryId", "=", categoryId)
        .execute();
    }

    if (earliestTransactionDate) {
      const timeZone = await budgetsService.getBudgetTimezone(budgetId);

      await balanceUpdater.updateMonthlyBalances(db, budgetId, [
        {
          date: toZonedDate(earliestTransactionDate, timeZone),
          categories: [moveToCategoryId],
        },
      ]);
    }
  };

  export const deleteCategory = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string,
    moveTransactionsToCategoryId: string
  ) => {
    await db.transaction().execute(async (db) => {
      await moveTransactionsToOtherCategory(
        db,
        budgetId,
        categoryId,
        moveTransactionsToCategoryId
      );

      const category = await db
        .selectFrom("categories")
        .select(["id", "groupId"])
        .where("budgetId", "=", budgetId)
        .where("id", "=", categoryId)
        .executeTakeFirstOrThrow();

      await categoriesService.moveCategory(
        db,
        budgetId,
        category.groupId,
        categoryId,
        10_000 // Put in the last position of the group
      );

      await db.deleteFrom("categories").where("id", "=", categoryId).execute();
    });
  };

  export const isIncomeCategory = async (
    db: Kysely<DB>,
    budgetId: string,
    categoryId: string | null
  ) => {
    if (!categoryId) return false;

    const category = await db
      .selectFrom("categories")
      .select("isIncome")
      .where("budgetId", "=", budgetId)
      .where("id", "=", categoryId)
      .executeTakeFirst();
    return category?.isIncome ?? false;
  };
}
