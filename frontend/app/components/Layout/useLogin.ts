import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUsersApi } from "~/api/usersApi";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";
import { useNavigate } from "react-router";

const useEnsureUser = () => {
  const { ensureUser } = useUsersApi();
  const { setBudgetId } = useCurrentBudgetContext();

  return useMutation({
    mutationFn: ensureUser,
    onSuccess: (data) => {
      setBudgetId(data.budgetId);
    },
  });
};

export const useLogin = () => {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const { mutate: ensureUser, data } = useEnsureUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      localStorage.setItem("redirect_path", window.location.pathname);
      loginWithRedirect({
        authorizationParams: { redirect_uri: window.location.origin },
      });
    }

    if (isAuthenticated && !isLoading) {
      const redirectPath = localStorage.getItem("redirect_path");
      if (redirectPath) {
        localStorage.removeItem("redirect_path");

        const shouldNavigate = window.location.pathname !== redirectPath;
        if (shouldNavigate) {
          navigate(redirectPath);
        }
      }
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
