import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTransaction,
  Transaction,
  UpdateTransaction,
} from "~/api/models";
import { useTransactionsApi } from "~/api/transactionsApi";

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

  return useMutation({
    mutationFn: (transaction: CreateTransaction) => create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(accountId),
      });
    },
  });
};

export const useUpdateTransaction = (accountId: string) => {
  const { patch } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transaction,
      transactionId,
    }: {
      transactionId: string;
      transaction: UpdateTransaction;
    }) => patch(transactionId, transaction),
    onSuccess: (data, { transactionId }) => {
      queryClient.setQueryData(
        queryKeys.transactions(accountId),
        (previous: Transaction) =>
          previous.map((todo) =>
            todo.id === transactionId ? { ...todo, ...data } : todo
          )
      );
    },
  });
};
