import { useQuery } from "@tanstack/react-query";
import { useAccountsApi } from "~/api/accountsApi";

export const useAccounts = () => {
  const { getAll } = useAccountsApi();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: getAll,
    throwOnError: true,
  });
};
