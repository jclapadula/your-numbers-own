import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCategoryGroupsApi } from "~/api/categoriesApi";
import { categoriesQueryKeys } from "../Categories/CategoriesQueries";
import { monthlyBudgetQueryKeys } from "../MonthlyBudgetQueries";
import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { transactionsQueryKeys } from "~/components/Transactions/TransactionsQueries";
import { useToast } from "~/components/Common/ToastContext";

export const categoryGroupsQueryKeys = {
  categoryGroups: ["categoryGroups"],
};

export const useCategoryGroups = () => {
  const { getAll } = useCategoryGroupsApi();

  return useQuery({
    queryKey: categoryGroupsQueryKeys.categoryGroups,
    queryFn: () => getAll(),
  });
};

export const useCreateCategoryGroup = () => {
  const { create } = useCategoryGroupsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryGroup: { name: string }) => create(categoryGroup),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
    },
  });
};

export const useUpdateCategoryGroup = () => {
  const { update } = useCategoryGroupsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
    },
  });
};

export const useDeleteCategoryGroup = () => {
  const { budgetId } = useCurrentBudgetContext();
  const { delete: deleteCategoryGroup } = useCategoryGroupsApi();
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      moveToGroupId,
    }: {
      id: string;
      moveToGroupId: string;
    }) => deleteCategoryGroup(id, moveToGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.categories,
      });
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId),
      });
      queryClient.invalidateQueries({
        queryKey: transactionsQueryKeys.transactions(budgetId),
      });
      setToast("Category group deleted successfully", "success");
    },
    onError: (error) => {
      console.error("Failed to delete category group:", error);
      setToast("Failed to delete category group", "error");
    },
  });
};

export const useMoveCategoryGroup = () => {
  const { move } = useCategoryGroupsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newPosition }: { id: string; newPosition: number }) =>
      move(id, newPosition),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
    },
  });
};
