import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { accountsApi } from "~/api/accountsApi";

export const useAccounts = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  useEffect(() => {
    setIsEnabled(true);
  }, []);

  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAccounts(),
    throwOnError: true,
    enabled: isEnabled,
  });
};
