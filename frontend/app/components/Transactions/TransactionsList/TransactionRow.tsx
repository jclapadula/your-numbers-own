import { useState } from "react";
import type { Transaction } from "~/api/models";
import {
  TransactionCategoryCell,
  TransactionDateCell,
  TransactionNotesCell,
  TransactionPayeeCell,
  TransactionPaymentDepositCell,
} from "./TransactionRowFields";
import { formatISO } from "date-fns";
import { rawNumberToAmount } from "~/components/Amount";
import { TransactionTableWidths } from "./TransactionListHeader";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../TransactionsQueries";
import { useAccountTransactions } from "../AccountTransactionsContext";
import { z } from "zod";
import { twMerge } from "tailwind-merge";

const transactionSchema = z.object({
  accountId: z.string().min(1),
  date: z.string().datetime({ offset: true }),
  payeeId: z.string().uuid().nullable(),
  destinationAccountId: z.string().uuid().nullable(),
  categoryId: z.string().uuid().nullable(),
  notes: z.string(),
  amount: z.coerce.number(),
  isReconciled: z.boolean(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const TransactionRow = ({
  transaction,
  isSelected,
  onSelect,
}: {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}) => {
  const { accountId } = useAccountTransactions();

  const transactionAmount = transaction.amount || null;

  const { mutateAsync: updateTransaction, isPending } =
    useUpdateTransaction(accountId);

  const saveChanges = async (changes: Partial<Transaction>) => {
    const result = transactionSchema
      .omit({ accountId: true })
      .partial()
      .safeParse(changes);

    if (!result.success) {
      return;
    }

    await updateTransaction({
      transactionId: transaction.id,
      changes: result.data,
    });
  };

  return (
    <>
      <div
        className={twMerge(
          "flex flex-row text-sm",
          isPending && "animate-pulse",
        )}
      >
        <div
          style={TransactionTableWidths.selection}
          className="flex items-center justify-center"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </div>
        <TransactionDateCell
          value={transaction.date}
          onChange={(date) => {
            saveChanges({ date });
          }}
        />
        <TransactionPayeeCell
          transaction={transaction}
          onChange={(changes) => {
            saveChanges(changes);
          }}
        />
        <TransactionCategoryCell
          value={transaction.categoryId || null}
          onChange={(categoryId) => {
            saveChanges({ categoryId });
          }}
          disabled={!!transaction.destinationAccountId}
        />
        <TransactionNotesCell
          value={transaction.notes || null}
          onChange={(notes) => {
            saveChanges({ notes });
          }}
        />
        <TransactionPaymentDepositCell
          rawValue={
            transactionAmount != null && transactionAmount < 0
              ? Math.abs(transactionAmount)
              : null
          }
          onChange={(amount) => {
            saveChanges({
              amount: rawNumberToAmount(amount * -1) || 0,
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
            saveChanges({
              amount: rawNumberToAmount(amount) || 0,
            });
          }}
        />
        <div
          style={TransactionTableWidths.reconciled}
          className="tooltip tooltip-left flex items-center justify-center"
          data-tip="Reconciled"
        >
          <input
            type="checkbox"
            defaultChecked={transaction.isReconciled}
            onChange={(e) => {
              saveChanges({
                isReconciled: e.target.checked,
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

type NewTransactionRowProps = {
  onClose: () => void;
};

export const NewTransactionRow = ({ onClose }: NewTransactionRowProps) => {
  const { accountId } = useAccountTransactions();
  const [newTransaction, setNewTransaction] = useState<TransactionFormData>({
    accountId,
    payeeId: null,
    destinationAccountId: null,
    categoryId: null,
    notes: "",
    date: formatISO(new Date()),
    amount: 0,
    isReconciled: true,
  });

  const transactionAmount = newTransaction.amount || null;

  const { mutateAsync: createTransaction, isPending } =
    useCreateTransaction(accountId);

  const onSave = async () => {
    const result = transactionSchema.safeParse(newTransaction);

    if (!result.success) {
      console.log(result.error);
      console.log({ newTransaction });
      return;
    }

    await createTransaction(result.data);
    onClose();
  };

  return (
    <>
      <div className="flex flex-row text-sm">
        <div
          style={TransactionTableWidths.selection}
          className="flex items-center justify-center"
        />
        <TransactionDateCell
          value={newTransaction.date}
          onChange={(date) => {
            setNewTransaction({ ...newTransaction, date });
          }}
          autoFocus
        />
        <TransactionPayeeCell
          transaction={newTransaction}
          onChange={(changes) => {
            setNewTransaction((t) => ({
              ...t,
              ...changes,
              ...(changes.destinationAccountId ? { categoryId: null } : {}),
            }));
          }}
        />
        <TransactionCategoryCell
          value={newTransaction.categoryId || null}
          onChange={(categoryId) => {
            setNewTransaction((t) => ({ ...t, categoryId }));
          }}
          disabled={!!newTransaction.destinationAccountId}
        />
        <TransactionNotesCell
          value={newTransaction.notes || null}
          onChange={(notes) => {
            setNewTransaction({ ...newTransaction, notes });
          }}
        />
        <TransactionPaymentDepositCell
          rawValue={
            transactionAmount != null && transactionAmount < 0
              ? Math.abs(transactionAmount)
              : null
          }
          onChange={(amount) => {
            setNewTransaction({
              ...newTransaction,
              amount: rawNumberToAmount(amount * -1) || 0,
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
              amount: rawNumberToAmount(amount) || 0,
            });
          }}
        />
        <div
          style={TransactionTableWidths.reconciled}
          className="tooltip tooltip-left flex items-center justify-center"
          data-tip="Reconciled"
        >
          <input
            type="checkbox"
            checked={newTransaction.isReconciled}
            onChange={(e) => {
              setNewTransaction({
                ...newTransaction,
                isReconciled: e.target.checked,
              });
            }}
          />
        </div>
      </div>
      <div className="flex flex-row justify-end p-2">
        <div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={onSave}
              disabled={isPending}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
