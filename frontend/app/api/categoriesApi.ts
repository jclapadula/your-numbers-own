import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type { Category, CategoryGroup } from "./models";

export const useCategoriesApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getAll: () => httpClient.get<Category[]>(`/budgets/${budgetId}/categories`),
    create: (category: { name: string; categoryGroupId: string }) =>
      httpClient.post(`/budgets/${budgetId}/categories`, category),
    delete: (id: string) =>
      httpClient.delete(`/budgets/${budgetId}/categories/${id}`),
    update: (id: string, name: string) =>
      httpClient.put(`/budgets/${budgetId}/categories/${id}`, {
        name,
      }),
    move: (id: string, newPosition: number, categoryGroupId: string) =>
      httpClient.put(
        `/budgets/${budgetId}/categories/${id}/move?newPosition=${newPosition}&categoryGroupId=${categoryGroupId}`,
        {}
      ),
  };
};

export const useCategoryGroupsApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getAll: () =>
      httpClient.get<CategoryGroup[]>(`/budgets/${budgetId}/category-groups`),
    create: (categoryGroup: { name: string }) =>
      httpClient.post(`/budgets/${budgetId}/category-groups`, categoryGroup),
    delete: (id: string) =>
      httpClient.delete(`/budgets/${budgetId}/category-groups/${id}`),
    update: (id: string, name: string) =>
      httpClient.put(`/budgets/${budgetId}/category-groups/${id}`, {
        name,
      }),
    move: (id: string, newPosition: number) =>
      httpClient.put(
        `/budgets/${budgetId}/category-groups/${id}/move?newPosition=${newPosition}`,
        {}
      ),
  };
};
