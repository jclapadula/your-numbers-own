import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type { MonthlyBudget, MonthOfYear } from "./models";

export const useMonthlyBudgetApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getMonthlyBudget: (monthOfYear: MonthOfYear) =>
      httpClient.get<MonthlyBudget>(
        `/budgets/${budgetId}/monthly-budget?month=${monthOfYear.month}&year=${monthOfYear.year}`
      ),
    updateMonthlyBudget: (
      categoryId: string | null,
      monthOfYear: MonthOfYear,
      assignedAmount: number
    ) =>
      httpClient.put(
        `/budgets/${budgetId}/monthly-budget/${categoryId ?? "null"}?month=${
          monthOfYear.month
        }&year=${monthOfYear.year}`,
        { assignedAmount }
      ),
  };
};
