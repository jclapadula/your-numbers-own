import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTransaction,
  Transaction,
  UpdateTransaction,
} from "~/api/models";
import { useTransactionsApi } from "~/api/transactionsApi";
import { useToast } from "../Common/ToastContext";
import { accountsQueryKeys } from "../Accounts/AccountsQueries";

const queryKeys = {
  transactions: (accountId: string) => ["accounts", accountId, "transactions"],
};

export const useTransactions = (accountId: string) => {
  const { getAll } = useTransactionsApi(accountId);

  return useQuery({
    queryKey: queryKeys.transactions(accountId),
    queryFn: () => getAll(),
  });
};

export const useCreateTransaction = (accountId: string) => {
  const { create } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: (transaction: CreateTransaction) => create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to create transaction", "error");
    },
  });
};

export const useUpdateTransaction = (accountId: string) => {
  const { patch } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: ({
      changes: changes,
      transactionId,
    }: {
      transactionId: string;
      changes: UpdateTransaction;
    }) => patch(transactionId, changes),
    onSuccess: (_, { transactionId, changes }) => {
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to update transaction", "error");
    },
    onMutate: async ({ transactionId, changes }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions(accountId),
      });

      // update transaction with new backend data
      queryClient.setQueryData(
        queryKeys.transactions(accountId),
        (previous: Transaction[]) =>
          previous.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, ...changes }
              : transaction
          )
      );
    },
  });
};

export const useDeleteTransactions = (accountId: string) => {
  const { deleteMany } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: (transactionIds: string[]) => deleteMany(transactionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to delete transaction", "error");
    },
  });
};
