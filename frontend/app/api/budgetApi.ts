import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type { Payee, Category } from "./models";

export const useBudgetApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getPayees: () => httpClient.get<Payee[]>(`/budgets/${budgetId}/payees`),
    createPayee: (name: string) =>
      httpClient.post<Payee>(`/budgets/${budgetId}/payees`, { name }),
  };
};
