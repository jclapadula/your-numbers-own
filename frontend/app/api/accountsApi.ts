import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type { BudgetAccount, CreateAccount } from "./models";

export const useAccountsApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getAll: () =>
      httpClient.get<BudgetAccount[]>(`/budgets/${budgetId}/accounts`),
    create: (account: CreateAccount) =>
      httpClient.post<CreateAccount>(`/budgets/${budgetId}/accounts`, account),
    delete: (id: string) =>
      httpClient.delete(`/budgets/${budgetId}/accounts/${id}`),
    update: (id: string, name: string) =>
      httpClient.put<CreateAccount>(`/budgets/${budgetId}/accounts/${id}`, {
        name,
      }),
  };
};
