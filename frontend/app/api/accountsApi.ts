import { httpClient } from "./httpClient";

export const accountsApi = {
  getAccounts: async () => {
    const response = await httpClient.get<{ name: string; balance: number }[]>(
      "/accounts"
    );
    return response;
  },
};
