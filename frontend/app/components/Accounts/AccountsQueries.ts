import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccountsApi } from "~/api/accountsApi";
import type { CreateAccount } from "~/api/models";

export const accountsQueryKeys = {
  accounts: ["accounts"],
};

export const useAccounts = () => {
  const { getAll } = useAccountsApi();

  return useQuery({
    queryKey: accountsQueryKeys.accounts,
    queryFn: () => getAll(),
  });
};

export const useCreateAccount = () => {
  const { create } = useAccountsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (account: CreateAccount) => create(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.accounts });
    },
  });
};

export const useUpdateAccount = () => {
  const { update } = useAccountsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.accounts });
    },
  });
};

export const useDeleteAccount = () => {
  const { delete: deleteAccount } = useAccountsApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.accounts });
    },
  });
};
