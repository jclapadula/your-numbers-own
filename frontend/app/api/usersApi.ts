import { useHttpClient } from "./httpClient";

export const useUsersApi = () => {
  const httpClient = useHttpClient();

  return {
    ensureUser: () => httpClient.post<{ budgetId: string }>("/users/me", {}),
  };
};
