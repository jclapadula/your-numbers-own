import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccountsApi } from "~/api/accountsApi";
import type { CreateAccount } from "~/api/models";

const queryKeys = {
  accounts: ["accounts"],
};

export const useAccounts = () => {
  const { getAll } = useAccountsApi();

  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => getAll(),
  });
};

export const useCreateAccount = () => {
  const { create } = useAccountsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (account: CreateAccount) => create(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
};
