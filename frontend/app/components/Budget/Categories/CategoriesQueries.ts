import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCategoriesApi } from "~/api/categoriesApi";
import { categoryGroupsQueryKeys } from "../CategoryGroups/CategoryGroupsQueries";
import { useToast } from "~/components/Common/ToastContext";

export const categoriesQueryKeys = {
  categories: ["categories"],
};

export const useCategories = () => {
  const { getAll } = useCategoriesApi();

  return useQuery({
    queryKey: categoriesQueryKeys.categories,
    queryFn: () => getAll(),
  });
};

export const useCreateCategory = () => {
  const { create } = useCategoriesApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: { name: string; categoryGroupId: string }) =>
      create(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.categories,
      });
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
    },
  });
};

export const useUpdateCategory = () => {
  const { update } = useCategoriesApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.categories,
      });
    },
  });
};

export const useDeleteCategory = () => {
  const { delete: deleteCategory } = useCategoriesApi();
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      moveTransactionsToCategoryId,
    }: {
      id: string;
      moveTransactionsToCategoryId: string;
    }) => deleteCategory(id, moveTransactionsToCategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.categories,
      });
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
      setToast("Category deleted successfully", "success");
    },
    onError: (error) => {
      console.error("Failed to delete category:", error);
      setToast("Failed to delete category", "error");
    },
  });
};

export const useMoveCategory = () => {
  const { move } = useCategoriesApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      newPosition,
      categoryGroupId,
    }: {
      id: string;
      newPosition: number;
      categoryGroupId: string;
    }) => move(id, newPosition, categoryGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.categories,
      });
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
    },
  });
};
