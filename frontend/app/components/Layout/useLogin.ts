import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUsersApi } from "~/api/usersApi";

const useEnsureUser = () => {
  const { ensureUser } = useUsersApi();

  return useMutation({
    mutationFn: ensureUser,
  });
};

export const useLogin = () => {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const { mutate: ensureUser, isPending, error } = useEnsureUser();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect({
        authorizationParams: { redirect_uri: window.location.origin },
      });
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      ensureUser();
    }
  }, [isAuthenticated, isLoading]);

  return {
    isAuthenticated: isAuthenticated,
    isLoading: isLoading,
  };
};
