import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type { Category } from "./models";

export const useCategoriesApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getAll: () => httpClient.get<Category[]>(`/budgets/${budgetId}/categories`),
    create: (category: { name: string }) =>
      httpClient.post(`/budgets/${budgetId}/categories`, category),
    delete: (id: string) =>
      httpClient.delete(`/budgets/${budgetId}/categories/${id}`),
    update: (id: string, name: string) =>
      httpClient.put(`/budgets/${budgetId}/categories/${id}`, {
        name,
      }),
  };
};
