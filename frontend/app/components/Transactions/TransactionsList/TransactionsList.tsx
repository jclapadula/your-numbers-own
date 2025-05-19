import { PlusIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import type { Transaction } from "~/api/models";
import { TransactionListHeader } from "./TransactionListHeader";
import { NewTransactionRow, TransactionRow } from "./TransactionRow";

type TransactionListActionsProps = {
  onAddTransaction: () => void;
};

const TransactionListActions = ({
  onAddTransaction,
}: TransactionListActionsProps) => {
  return (
    <div className="p-2">
      <button className="btn btn-sm btn-ghost" onClick={onAddTransaction}>
        <PlusIcon className="text-primary size-4" />
        <span className="text-primary">Add</span>
      </button>
    </div>
  );
};

export const AccountTransactionsList = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const [addingTransaction, setAddingTransaction] = useState(false);

  return (
    <div className="h-full">
      <TransactionListActions
        onAddTransaction={() => setAddingTransaction(true)}
      />
      <div className="border border-base-content/5">
        <div>
          <TransactionListHeader />
          {addingTransaction && (
            <NewTransactionRow onClose={() => setAddingTransaction(false)} />
          )}
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
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
