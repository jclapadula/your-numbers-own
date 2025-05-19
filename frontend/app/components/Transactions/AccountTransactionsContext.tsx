import { createContext, useContext } from "react";
import type { ReactNode } from "react";

interface AccountTransactionsContextType {
  accountId: string;
}

const AccountTransactionsContext =
  createContext<AccountTransactionsContextType>({
    accountId: "",
  });

export const useAccountTransactions = () =>
  useContext(AccountTransactionsContext);

interface AccountTransactionsProviderProps {
  children: ReactNode;
  accountId: string;
}

export function AccountTransactionsContextProvider({
  children,
  accountId,
}: AccountTransactionsProviderProps) {
  return (
    <AccountTransactionsContext.Provider value={{ accountId }}>
      {children}
    </AccountTransactionsContext.Provider>
  );
}
