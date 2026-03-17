import { useState } from "react";
import { useParams } from "react-router";
import { useAccounts } from "../Accounts/AccountsQueries";
import { AccountTransactionsContextProvider } from "./AccountTransactionsContext";
import { AccountTransactionsHeader } from "./AccountTransactionsHeader";
import { ReconciliationContextProvider } from "./ReconciliationContext";
import { AccountTransactionsList } from "./TransactionsList/TransactionsList";
import { useDeleteTransactions, useTransactions } from "./TransactionsQueries";

export default function AccountTransactions() {
  const { accountId = "" } = useParams();

  const [addingTransaction, setAddingTransaction] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(),
  );

  const { isLoading: isLoadingAccounts } = useAccounts();
  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactions(accountId);
  const { mutateAsync: deleteTransaction } = useDeleteTransactions(accountId);

  const sortedTransactions = transactions?.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const onSelect = (transactionId: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const onSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTransactions(
        new Set(sortedTransactions?.map((t) => t.id) ?? []),
      );
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const onDeleteSelected = async () => {
    await deleteTransaction(Array.from(selectedTransactions));
    setSelectedTransactions(new Set());
  };

  if (isLoadingTransactions || isLoadingAccounts)
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner text-primary w-10"></span>
      </div>
    );

  return (
    <AccountTransactionsContextProvider accountId={accountId}>
      <ReconciliationContextProvider>
        <div className="flex flex-col h-full w-full">
          <AccountTransactionsHeader
            accountId={accountId}
            onAddTransaction={() => setAddingTransaction(true)}
            selectedCount={selectedTransactions.size}
            onDeleteSelected={onDeleteSelected}
            onSelectAll={onSelectAll}
          />
          <AccountTransactionsList
            transactions={sortedTransactions || []}
            addingTransaction={addingTransaction}
            onCloseAddTransaction={() => setAddingTransaction(false)}
            selectedTransactions={selectedTransactions}
            onSelect={onSelect}
          />
        </div>
      </ReconciliationContextProvider>
    </AccountTransactionsContextProvider>
  );
}
