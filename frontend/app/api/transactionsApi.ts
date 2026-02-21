import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type {
  CreateTransaction,
  ImportCsvRequest,
  ImportCsvResponse,
  Transaction,
  UpdateTransaction,
} from "./models";

export const useTransactionsApi = (accountId: string) => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    getAll: () =>
      httpClient.get<Transaction[]>(
        `/budgets/${budgetId}/accounts/${accountId}/transactions`
      ),
    create: (transaction: CreateTransaction) =>
      httpClient.post<CreateTransaction>(
        `/budgets/${budgetId}/accounts/${accountId}/transactions`,
        transaction
      ),
    deleteMany: (transactionIds: string[]) =>
      httpClient.delete(
        `/budgets/${budgetId}/accounts/${accountId}/transactions`,
        { transactionIds }
      ),
    patch: (transactionId: string, transaction: UpdateTransaction) =>
      httpClient.patch<UpdateTransaction>(
        `/budgets/${budgetId}/accounts/${accountId}/transactions/${transactionId}`,
        transaction
      ),
    importCsv: (request: ImportCsvRequest) =>
      httpClient.post<ImportCsvResponse>(
        `/budgets/${budgetId}/accounts/${accountId}/transactions/import-csv`,
        request
      ),
  };
};
