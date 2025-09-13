import { usePlaidLink } from "react-plaid-link";
import { useCreateLinkToken } from "./PlaidQueries";
import { useState, useEffect, useCallback } from "react";

type PlaidLinkProps = {
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit: () => void;
  children: React.ReactNode;
};

export const PlaidLink = ({ onSuccess, onExit, children }: PlaidLinkProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: createLinkToken, data: linkTokenData } =
    useCreateLinkToken();

  const handleSuccess = useCallback(
    (publicToken: string, metadata: any) => {
      setIsLoading(false);
      onSuccess(publicToken, metadata);
    },
    [onSuccess]
  );

  const handleExit = useCallback(
    (error: any) => {
      setIsLoading(false);
      if (error) {
        console.error("Plaid Link error:", error);
      }
      onExit();
    },
    [onExit]
  );

  const { open, ready } = usePlaidLink({
    token: linkTokenData?.link_token || null,
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  // Auto-open Plaid Link once it becomes ready after token creation
  useEffect(() => {
    if (isLoading && ready && linkTokenData) {
      open();
    }
  }, [isLoading, ready, linkTokenData, open]);

  const handleClick = async () => {
    if (!linkTokenData) {
      setIsLoading(true);
      try {
        await createLinkToken();
        // The useEffect will auto-open once ready becomes true
      } catch (error) {
        console.error("Failed to create link token:", error);
        setIsLoading(false);
      }
    } else if (ready) {
      open();
    }
  };

  // Show spinner overlay while loading
  if (isLoading) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 bg-base-100/80 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <div className="loading loading-spinner loading-sm"></div>
            <span className="text-sm">Preparing bank connection...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
};
