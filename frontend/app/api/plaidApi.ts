import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type {
  PlaidLinkToken,
  PlaidConnectAccountsRequest,
  PlaidConnectAccountsResponse,
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

    connectAccounts: (data: PlaidConnectAccountsRequest) =>
      httpClient.post<PlaidConnectAccountsResponse>(
        `/budgets/${budgetId}/plaid/connect-accounts`,
        data
      ),

    getPlaidAccounts: () =>
      httpClient.get<PlaidAccountsResponse>(
        `/budgets/${budgetId}/plaid/accounts`
      ),

    syncPlaidAccount: (accountId: string, data: PlaidSyncRequest = {}) =>
      httpClient.post<PlaidSyncResponse>(
        `/budgets/${budgetId}/accounts/${accountId}/plaid/sync`,
        data
      ),
  };
};
