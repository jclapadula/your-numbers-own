import { Auth0Provider } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { config } from "~/config";
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

  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    setRedirectUri(window?.location?.origin);
  }, []);

  return (
    <Auth0Provider
      domain={config.auth0.domain}
      clientId={config.auth0.clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: config.auth0.audience,
      }}
      useRefreshTokens
    >
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
    </Auth0Provider>
  );
};
