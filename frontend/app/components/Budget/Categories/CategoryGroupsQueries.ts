import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCategoryGroupsApi } from "~/api/categoriesApi";

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
  const { delete: deleteCategoryGroup } = useCategoryGroupsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategoryGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryGroupsQueryKeys.categoryGroups,
      });
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
