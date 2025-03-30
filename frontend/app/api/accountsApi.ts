import { useHttpClient } from "./httpClient";

export const useAccountsApi = () => {
  const httpClient = useHttpClient();

  return {
    getAll: () =>
      httpClient.get<{ name: string; balance: number }[]>("/accounts"),
  };
};
