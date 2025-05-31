import { db } from "../db";

export namespace budgetsService {
  export const getBudgetTimezone = async (budgetId: string) => {
    const { timezone } = (await db
      .selectFrom("budgets")
      .where("id", "=", budgetId)
      .select("timezone")
      .executeTakeFirst()) || { timezone: "Europe/Berlin" };

    return timezone;
  };
}
