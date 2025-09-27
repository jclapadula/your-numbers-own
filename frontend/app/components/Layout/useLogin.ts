import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUsersApi } from "~/api/usersApi";
import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";
import { useNavigate } from "react-router";
import { useAuth } from "../Auth/AuthContext";

const useEnsureUser = () => {
  const { ensureUser } = useUsersApi();
  const { setBudgetId, setTimezone } = useCurrentBudgetContext();

  return useMutation({
    mutationFn: ensureUser,
    onSuccess: (data) => {
      setBudgetId(data.budgetId);
      setTimezone(data.timezone);
    },
  });
};

export const useLogin = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { mutate: ensureUser } = useEnsureUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Store current path for redirect after login
      localStorage.setItem("redirect_path", window.location.pathname);
      navigate("/login");
    }

    if (isAuthenticated && !isLoading) {
      const redirectPath = localStorage.getItem("redirect_path");
      if (redirectPath && redirectPath !== "/login" && redirectPath !== "/register") {
        localStorage.removeItem("redirect_path");
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      ensureUser();
    }
  }, [isAuthenticated, isLoading, ensureUser]);

  return {
    isAuthenticated,
    isLoading,
  };
};
