import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlaidApi } from "~/api/plaidApi";
import type {
  PlaidAccountLinkRequest,
  PlaidSyncRequest,
} from "~/api/models";

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

export const useLinkPlaidAccount = () => {
  const { linkPlaidAccount } = usePlaidApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlaidAccountLinkRequest) => linkPlaidAccount(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plaidQueryKeys.accounts(variables.account_id),
      });
    },
  });
};

export const usePlaidAccounts = (budgetId: string) => {
  const { getPlaidAccounts } = usePlaidApi();

  return useQuery({
    queryKey: plaidQueryKeys.accounts(budgetId),
    queryFn: () => getPlaidAccounts(),
  });
};

export const useSyncPlaidAccount = () => {
  const { syncPlaidAccount } = usePlaidApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data?: PlaidSyncRequest }) =>
      syncPlaidAccount(accountId, data),
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