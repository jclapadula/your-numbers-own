import {
  ArrowUpTrayIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { useState } from "react";
import type { Transaction } from "~/api/models";
import { useAccountTransactions } from "../AccountTransactionsContext";
import { CsvImportModal } from "../CsvImportModal";
import { useDeleteTransactions } from "../TransactionsQueries";
import { TransactionListHeader } from "./TransactionListHeader";
import { NewTransactionRow, TransactionRow } from "./TransactionRow";

type TransactionListActionsProps = {
  onAddTransaction: () => void;
  onImport: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
};

const TransactionListActions = ({
  onAddTransaction,
  onImport,
  selectedCount,
  onDeleteSelected,
}: TransactionListActionsProps) => {
  return (
    <div className="p-2 flex justify-between">
      <div className="flex gap-2">
        <button
          className="btn btn-sm btn-primary btn-outline"
          onClick={onAddTransaction}
        >
          <PlusIcon className="size-4" />
          Add
        </button>
        <button
          className="btn btn-sm btn-secondary btn-outline"
          onClick={onImport}
        >
          <ArrowUpTrayIcon className="size-4" />
          Import
        </button>
      </div>
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
  const [importingCsv, setImportingCsv] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(),
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
        onImport={() => setImportingCsv(true)}
        selectedCount={selectedTransactions.size}
        onDeleteSelected={onDeleteSelected}
      />
      {importingCsv && (
        <CsvImportModal onClose={() => setImportingCsv(false)} />
      )}
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
