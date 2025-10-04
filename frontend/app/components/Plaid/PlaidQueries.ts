import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlaidApi } from "~/api/plaidApi";
import type { PlaidConnectAccountsRequest, PlaidSyncRequest } from "~/api/models";

export const plaidQueryKeys = {
  linkToken: ["plaid", "link-token"],
  accounts: (budgetId: string) => ["plaid", "accounts", budgetId],
};

export const useCreateLinkToken = () => {
  const { createLinkToken } = usePlaidApi();

  return useMutation({
    mutationFn: () => createLinkToken(),
  });
};

export const useConnectAccounts = () => {
  const { connectAccounts } = usePlaidApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlaidConnectAccountsRequest) => connectAccounts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useSyncPlaidAccount = () => {
  const { syncPlaidAccount } = usePlaidApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data?: PlaidSyncRequest;
    }) => syncPlaidAccount(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["accounts"],
      });
    },
  });
};

