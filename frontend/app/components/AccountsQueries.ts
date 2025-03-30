import { useQuery } from "@tanstack/react-query";
import { useHttpClient } from "~/api/httpClient";

export const useAccounts = () => {
  const http = useHttpClient();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => http.get<{ name: string; balance: number }[]>("/accounts"),
    throwOnError: true,
  });
};
