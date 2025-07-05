import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMonthlyBudgetApi } from "~/api/monthlyBudgetApi";
import type { MonthOfYear } from "~/api/models";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";
import { useToast } from "../Common/ToastContext";

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

  const query = useQuery({
    queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId, monthOfYear),
    queryFn: () => getMonthlyBudget(monthOfYear),
  });

  // // eager load of next month
  // const nextMonthOfYear = getNextMonthOfYear(monthOfYear);
  // useQuery({
  //   queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId, nextMonthOfYear),
  //   queryFn: () => getMonthlyBudget(nextMonthOfYear),
  //   enabled: !query.isLoading,
  // });

  // // eager load of previous month
  // const previousMonthOfYear = getPreviousMonthOfYear(monthOfYear);
  // useQuery({
  //   queryKey: monthlyBudgetQueryKeys.monthlyBudget(
  //     budgetId,
  //     previousMonthOfYear
  //   ),
  //   queryFn: () => getMonthlyBudget(previousMonthOfYear),
  //   enabled: !query.isLoading,
  // });

  return query;
};

export const useUpdateMonthlyBudget = () => {
  const { budgetId } = useCurrentBudgetContext();
  const { updateMonthlyBudget } = useMonthlyBudgetApi();
  const queryClient = useQueryClient();
  const { setToast } = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId),
      });
    },
    onError: (error) => {
      setToast(
        "There was an error updating the budget. Please try again later.",
        "error"
      );
    },
  });
};
