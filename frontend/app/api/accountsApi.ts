import { useHttpClient } from "./httpClient";
import type { BudgetAccount, CreateAccount } from "./models";

export const useAccountsApi = () => {
  const httpClient = useHttpClient();

  return {
    getAll: () => httpClient.get<BudgetAccount[]>("/accounts"),
    create: (account: CreateAccount) =>
      httpClient.post<CreateAccount>("/accounts", account),
    delete: (id: string) => httpClient.delete(`/accounts/${id}`),
    update: (id: string, name: string) =>
      httpClient.put<CreateAccount>(`/accounts/${id}`, { name }),
  };
};
