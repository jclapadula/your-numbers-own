import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import type { Transaction } from "~/api/models";
import { TransactionListHeader } from "./TransactionListHeader";
import { NewTransactionRow, TransactionRow } from "./TransactionRow";
import { useDeleteTransactions } from "../TransactionsQueries";
import { useAccountTransactions } from "../AccountTransactionsContext";

type TransactionListActionsProps = {
  onAddTransaction: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
};

const TransactionListActions = ({
  onAddTransaction,
  selectedCount,
  onDeleteSelected,
}: TransactionListActionsProps) => {
  return (
    <div className="p-2 flex justify-between">
      <button
        className="btn btn-sm btn-primary btn-outline"
        onClick={onAddTransaction}
      >
        <PlusIcon className=" size-4" />
        Add
      </button>
      {selectedCount > 0 && (
        <button className="btn btn-sm btn-error" onClick={onDeleteSelected}>
          <TrashIcon className="size-4" />
          Delete Selected
        </button>
      )}
    </div>
  );
};

export const AccountTransactionsList = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const { accountId } = useAccountTransactions();
  const { mutateAsync: deleteTransaction } = useDeleteTransactions(accountId);

  const onSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTransactions(new Set(transactions.map((t) => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const onSelect = (transactionId: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const onDeleteSelected = async () => {
    await deleteTransaction(Array.from(selectedTransactions));
    setSelectedTransactions(new Set());
  };

  return (
    <div className="h-full">
      <TransactionListActions
        onAddTransaction={() => setAddingTransaction(true)}
        selectedCount={selectedTransactions.size}
        onDeleteSelected={onDeleteSelected}
      />
      <div className="border border-base-content/5">
        <div>
          <TransactionListHeader
            selectedCount={selectedTransactions.size}
            totalCount={transactions.length}
            onSelectAll={onSelectAll}
          />
          {addingTransaction && (
            <NewTransactionRow onClose={() => setAddingTransaction(false)} />
          )}
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedTransactions.has(transaction.id)}
              onSelect={(selected) => onSelect(transaction.id, selected)}
            />
          ))}
          {transactions.length === 0 && !addingTransaction && (
            <div className="text-center h-full p-4">
              This account has no transactions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
