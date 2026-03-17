import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ReconciliationContextType {
  isReconciling: boolean;
  reconciliationBankBalance: number;
  reconciliationPendingIds: Set<string>;
  startReconciliation: (bankBalance: number) => void;
  cancelReconciliation: () => void;
  toggleReconciliationPending: (transactionId: string) => void;
  addReconciliationPending: (transactionId: string) => void;
}

const ReconciliationContext = createContext<ReconciliationContextType>({
  isReconciling: false,
  reconciliationBankBalance: 0,
  reconciliationPendingIds: new Set(),
  startReconciliation: () => {},
  cancelReconciliation: () => {},
  toggleReconciliationPending: () => {},
  addReconciliationPending: () => {},
});

export const useReconciliation = () => useContext(ReconciliationContext);

export function ReconciliationContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationBankBalance, setReconciliationBankBalance] = useState(0);
  const [reconciliationPendingIds, setReconciliationPendingIds] = useState<
    Set<string>
  >(new Set());

  const startReconciliation = (bankBalance: number) => {
    setReconciliationBankBalance(bankBalance);
    setReconciliationPendingIds(new Set());
    setIsReconciling(true);
  };

  const cancelReconciliation = () => {
    setIsReconciling(false);
    setReconciliationBankBalance(0);
    setReconciliationPendingIds(new Set());
  };

  const toggleReconciliationPending = (transactionId: string) => {
    setReconciliationPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const addReconciliationPending = (transactionId: string) => {
    setReconciliationPendingIds((prev) => new Set([...prev, transactionId]));
  };

  return (
    <ReconciliationContext.Provider
      value={{
        isReconciling,
        reconciliationBankBalance,
        reconciliationPendingIds,
        startReconciliation,
        cancelReconciliation,
        toggleReconciliationPending,
        addReconciliationPending,
      }}
    >
      {children}
    </ReconciliationContext.Provider>
  );
}
