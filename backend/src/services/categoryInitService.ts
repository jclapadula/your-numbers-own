import type { Kysely } from "kysely";
import type { DB } from "../db/models";

export namespace categoryInitService {
  const createIncomeCategories = async (db: Kysely<DB>, budgetId: string) => {
    const incomeCategoryGroup = await db
      .insertInto("category_groups")
      .values({
        budgetId,
        name: "Income",
        isIncome: true,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    await db
      .insertInto("categories")
      .values({
        budgetId,
        name: "Income",
        groupId: incomeCategoryGroup.id,
        isIncome: true,
      })
      .execute();
  };

  export const createExpenseCategories = async (
    db: Kysely<DB>,
    budgetId: string
  ) => {
    const categories = [
      {
        groupName: "Monthly",
        categories: [
          {
            name: "Rent",
          },
          {
            name: "Bills",
          },
        ],
      },
      {
        groupName: "Frequent",
        categories: [
          {
            name: "Groceries",
          },
          {
            name: "Going out",
          },
        ],
      },
      {
        groupName: "Savings",
        categories: [
          {
            name: "Emergency Fund",
          },
          {
            name: "Home",
          },
        ],
      },
    ];

    for (const [index, group] of categories.entries()) {
      const monthlyCategoryGroup = await db
        .insertInto("category_groups")
        .values({
          budgetId,
          name: group.groupName,
          position: index,
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();

      for (const [index, category] of group.categories.entries()) {
        await db
          .insertInto("categories")
          .values({
            budgetId,
            name: category.name,
            position: index,
            groupId: monthlyCategoryGroup.id,
          })
          .execute();
      }
    }
  };

  export const createInitialCategories = async (
    db: Kysely<DB>,
    budgetId: string
  ) => {
    await createIncomeCategories(db, budgetId);
    await createExpenseCategories(db, budgetId);
  };
}
