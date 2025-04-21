import { useState } from "react";
import type { Transaction } from "~/api/models";
import {
  TransactionCategoryCell,
  TransactionDateCell,
  TransactionNotesCell,
  TransactionPayeeCell,
  TransactionPaymentDepositCell,
} from "./TransactionRowFields";
import { useCategories, usePayees } from "~/components/Budget/budgetQueries";
import { format } from "date-fns";
import { rawNumberToAmount, rawStringToAmount } from "~/components/Amount";

export const TransactionRow = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  return (
    <tr>
      <td>{transaction.date}</td>
      <td>{transaction.payeeId}</td>
      <td>{transaction.categoryId}</td>
      <td>{transaction.notes}</td>
      <td>{transaction.amount}</td>
      <td>{transaction.amount}</td>
      <td>{transaction.isReconciled}</td>
    </tr>
  );
};

type NewTransactionRowProps = {
  onCancel: () => void;
};

export const NewTransactionRow = ({ onCancel }: NewTransactionRowProps) => {
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    payeeId: "",
    categoryId: "",
    notes: "",
  });

  const transactionAmount = rawStringToAmount(newTransaction.amount || null);

  return (
    <>
      <tr>
        <TransactionDateCell
          value={newTransaction.date || format(new Date(), "yyyy-MM-dd")}
          onChange={(date) => {
            setNewTransaction({ ...newTransaction, date });
          }}
        />
        <TransactionPayeeCell
          value={newTransaction.payeeId || null}
          onChange={(payeeId) => {
            setNewTransaction({ ...newTransaction, payeeId });
          }}
        />
        <TransactionCategoryCell
          value={newTransaction.categoryId || null}
          onChange={(categoryId) => {
            setNewTransaction({ ...newTransaction, categoryId });
          }}
        />
        <TransactionNotesCell
          value={newTransaction.notes || null}
          onChange={(notes) => {
            setNewTransaction({ ...newTransaction, notes });
          }}
        />
        <TransactionPaymentDepositCell
          value={
            transactionAmount != null && transactionAmount <= 0
              ? Math.abs(transactionAmount)
              : null
          }
          onChange={(amount) => {
            setNewTransaction({
              ...newTransaction,
              amount: `-${rawNumberToAmount(amount)}`,
            });
          }}
        />
        <TransactionPaymentDepositCell
          value={
            transactionAmount != null && transactionAmount > 0
              ? transactionAmount
              : null
          }
          onChange={(amount) => {
            setNewTransaction({
              ...newTransaction,
              amount: `${rawNumberToAmount(amount)}`,
            });
          }}
        />
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td colSpan={6}></td>
        <td>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary">Save</button>
          </div>
        </td>
      </tr>
    </>
  );
};
