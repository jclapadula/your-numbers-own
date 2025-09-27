import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "./Auth/AuthContext";
import { CurrentBudgetProvider } from "./Contexts/CurrentBudgetContext";
import { ToastProvider } from "./Common/ToastContext";
import { SelectedMonthProvider } from "./Budget/SelectedMonthContext";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const ContextProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <CurrentBudgetProvider>
            <SelectedMonthProvider>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </SelectedMonthProvider>
          </CurrentBudgetProvider>
        </QueryClientProvider>
      </ToastProvider>
    </AuthProvider>
  );
};
