import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMonthlyBudgetApi } from "~/api/monthlyBudgetApi";
import type { MonthOfYear } from "~/api/models";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";
import {
  getNextMonthOfYear,
  getPreviousMonthOfYear,
} from "../Common/dateUtils";

export const monthlyBudgetQueryKeys = {
  monthlyBudget: (budgetId: string, monthOfYear?: MonthOfYear) => [
    "budgets",
    budgetId,
    "monthlyBudget",
    ...(monthOfYear ? [monthOfYear.month, monthOfYear.year] : []),
  ],
};

export const useMonthlyBudget = (monthOfYear: MonthOfYear) => {
  const { budgetId } = useCurrentBudgetContext();
  const { getMonthlyBudget } = useMonthlyBudgetApi();

  // eager load of next month
  const nextMonthOfYear = getNextMonthOfYear(monthOfYear);
  useQuery({
    queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId, nextMonthOfYear),
    queryFn: () => getMonthlyBudget(nextMonthOfYear),
  });

  // eager load of previous month
  const previousMonthOfYear = getPreviousMonthOfYear(monthOfYear);
  useQuery({
    queryKey: monthlyBudgetQueryKeys.monthlyBudget(
      budgetId,
      previousMonthOfYear
    ),
    queryFn: () => getMonthlyBudget(previousMonthOfYear),
  });

  return useQuery({
    queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId, monthOfYear),
    queryFn: () => getMonthlyBudget(monthOfYear),
  });
};

export const useUpdateMonthlyBudget = () => {
  const { budgetId } = useCurrentBudgetContext();
  const { updateMonthlyBudget } = useMonthlyBudgetApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      monthOfYear,
      assignedAmount,
    }: {
      categoryId: string | null;
      monthOfYear: MonthOfYear;
      assignedAmount: number;
    }) => updateMonthlyBudget(categoryId, monthOfYear, assignedAmount),
    onSuccess: (_, { monthOfYear }) => {
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId, monthOfYear),
      });
    },
  });
};
