import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBudgetApi } from "~/api/budgetApi";

const queryKeys = {
  payees: ["payees"],
  categories: ["categories"],
};

export const usePayees = () => {
  const budgetApi = useBudgetApi();

  return useQuery({
    queryKey: queryKeys.payees,
    queryFn: () => budgetApi.getPayees(),
  });
};

export const useCreatePayee = () => {
  const budgetApi = useBudgetApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => budgetApi.createPayee(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payees });
    },
  });
};
