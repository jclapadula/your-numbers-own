import { useHttpClient } from "./httpClient";

export const useUsersApi = () => {
  const httpClient = useHttpClient();

  return {
    ensureUser: () => httpClient.post("/users/me", {}),
  };
};
