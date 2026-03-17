import type { Transaction } from "~/api/models";
import { NewTransactionRow, TransactionRow } from "./TransactionRow";

type AccountTransactionsListProps = {
  transactions: Transaction[];
  addingTransaction: boolean;
  onCloseAddTransaction: () => void;
  selectedTransactions: Set<string>;
  onSelect: (transactionId: string, selected: boolean) => void;
};

export const AccountTransactionsList = ({
  transactions,
  addingTransaction,
  onCloseAddTransaction,
  selectedTransactions,
  onSelect,
}: AccountTransactionsListProps) => {
  return (
    <div className="border border-base-content/5">
      {addingTransaction && (
        <NewTransactionRow onClose={onCloseAddTransaction} />
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
  );
};
