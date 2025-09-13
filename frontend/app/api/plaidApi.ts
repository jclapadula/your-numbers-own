import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type {
  PlaidLinkToken,
  PlaidAccountLinkRequest,
  PlaidAccountLinkResponse,
  PlaidAccountsResponse,
  PlaidSyncRequest,
  PlaidSyncResponse,
} from "./models";

export const usePlaidApi = () => {
  const httpClient = useHttpClient();
  const { budgetId } = useCurrentBudgetContext();

  return {
    createLinkToken: () =>
      httpClient.post<PlaidLinkToken>("/plaid/link-token", {}),

    linkPlaidAccount: (data: PlaidAccountLinkRequest) =>
      httpClient.post<PlaidAccountLinkResponse>(
        `/budgets/${budgetId}/plaid/link-account`,
        data
      ),

    getPlaidAccounts: () =>
      httpClient.get<PlaidAccountsResponse>(`/budgets/${budgetId}/plaid/accounts`),

    syncPlaidAccount: (accountId: string, data: PlaidSyncRequest = {}) =>
      httpClient.post<PlaidSyncResponse>(
        `/budgets/${budgetId}/accounts/${accountId}/plaid/sync`,
        data
      ),
  };
};