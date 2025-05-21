import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTransaction,
  Transaction,
  UpdateTransaction,
} from "~/api/models";
import { useTransactionsApi } from "~/api/transactionsApi";
import { useToast } from "../Common/ToastContext";

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
    onError: (error) => {
      console.error(error);
      setToast("Failed to update transaction", "error");
    },
  });
};
