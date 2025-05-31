import { useHttpClient } from "./httpClient";

export const useUsersApi = () => {
  const httpClient = useHttpClient();

  return {
    ensureUser: () =>
      httpClient.post<{ budgetId: string; timezone: string }>("/users/me", {}),
  };
};
