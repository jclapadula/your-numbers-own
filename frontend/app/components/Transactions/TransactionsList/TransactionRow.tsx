import { useState } from "react";
import type { Transaction } from "~/api/models";
import {
  TransactionCategoryCell,
  TransactionDateCell,
  TransactionNotesCell,
  TransactionPayeeCell,
  TransactionPaymentDepositCell,
} from "./TransactionRowFields";
import { format } from "date-fns";
import { rawNumberToAmount } from "~/components/Amount";
import { TransactionTableWidths } from "./TransactionListHeader";

export const TransactionRow = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  return (
    <div className="flex flex-row">
      <div style={TransactionTableWidths.date}>{transaction.date}</div>
      <div>{transaction.payeeId}</div>
      <div>{transaction.categoryId}</div>
      <div>{transaction.notes}</div>
      <div>{transaction.amount}</div>
      <div>{transaction.amount}</div>
      <div>{transaction.isReconciled}</div>
    </div>
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

  const transactionAmount = newTransaction.amount || null;

  return (
    <>
      <div className="flex flex-row">
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
          rawValue={
            transactionAmount != null && transactionAmount <= 0
              ? Math.abs(transactionAmount)
              : null
          }
          onChange={(amount) => {
            setNewTransaction({
              ...newTransaction,
              amount: rawNumberToAmount(amount * -1) || undefined,
            });
          }}
        />
        <TransactionPaymentDepositCell
          rawValue={
            transactionAmount != null && transactionAmount > 0
              ? transactionAmount
              : null
          }
          onChange={(amount) => {
            setNewTransaction({
              ...newTransaction,
              amount: rawNumberToAmount(amount) || undefined,
            });
          }}
        />
        <div></div>
        <div></div>
      </div>
      <div className="flex flex-row">
        <div></div>
        <div>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary">Save</button>
          </div>
        </div>
      </div>
    </>
  );
};
