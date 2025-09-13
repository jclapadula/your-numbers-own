import { useCurrentBudgetContext } from "~/components/Contexts/CurrentBudgetContext";
import { useHttpClient } from "./httpClient";
import type {
  PlaidLinkToken,
  PlaidExchangeTokenRequest,
  PlaidExchangeTokenResponse,
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

    exchangeToken: (data: PlaidExchangeTokenRequest) =>
      httpClient.post<PlaidExchangeTokenResponse>(
        `/budgets/${budgetId}/plaid/exchange-token`,
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
