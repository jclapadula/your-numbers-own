import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTransaction,
  ImportCsvRequest,
  ImportCsvResponse,
  Transaction,
  UpdateTransaction,
} from "~/api/models";
import { useTransactionsApi } from "~/api/transactionsApi";
import { useToast } from "../Common/ToastContext";
import { accountsQueryKeys } from "../Accounts/AccountsQueries";
import { monthlyBudgetQueryKeys } from "../Budget/MonthlyBudgetQueries";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";

export const transactionsQueryKeys = {
  transactions: (accountId: string) => ["accounts", accountId, "transactions"],
};

export const useTransactions = (accountId: string) => {
  const { getAll } = useTransactionsApi(accountId);

  return useQuery({
    queryKey: transactionsQueryKeys.transactions(accountId),
    queryFn: () => getAll(),
  });
};

export const useCreateTransaction = (accountId: string) => {
  const { budgetId } = useCurrentBudgetContext();
  const { create } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: (transaction: CreateTransaction) => create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionsQueryKeys.transactions(accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId),
      });
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to create transaction", "error");
    },
  });
};

export const useUpdateTransaction = (accountId: string) => {
  const { budgetId } = useCurrentBudgetContext();
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId),
      });
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to update transaction", "error");
    },
    onMutate: async ({ transactionId, changes }) => {
      await queryClient.cancelQueries({
        queryKey: transactionsQueryKeys.transactions(accountId),
      });

      // update transaction with new backend data
      queryClient.setQueryData(
        transactionsQueryKeys.transactions(accountId),
        (previous: Transaction[]) =>
          previous.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, ...changes }
              : transaction,
          ),
      );
    },
  });
};

export const useImportTransactions = (accountId: string) => {
  const { budgetId } = useCurrentBudgetContext();
  const { importCsv } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: (request: ImportCsvRequest) => importCsv(request),
    onSuccess: (result: ImportCsvResponse) => {
      queryClient.invalidateQueries({
        queryKey: transactionsQueryKeys.transactions(accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId),
      });
      const parts = [
        result.imported > 0 && `${result.imported} imported`,
        result.updated > 0 && `${result.updated} updated`,
        result.skipped > 0 && `${result.skipped} skipped`,
      ].filter(Boolean);
      setToast(parts.length ? parts.join(", ") : "Nothing new to import", "success");
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to import transactions", "error");
    },
  });
};

export const useDeleteTransactions = (accountId: string) => {
  const { budgetId } = useCurrentBudgetContext();
  const { deleteMany } = useTransactionsApi(accountId);
  const queryClient = useQueryClient();
  const { setToast } = useToast();

  return useMutation({
    mutationFn: (transactionIds: string[]) => deleteMany(transactionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionsQueryKeys.transactions(accountId),
      });
      queryClient.invalidateQueries({
        queryKey: accountsQueryKeys.accounts,
      });
      queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueryKeys.monthlyBudget(budgetId),
      });
    },
    onError: (error) => {
      console.error(error);
      setToast("Failed to delete transaction", "error");
    },
  });
};
