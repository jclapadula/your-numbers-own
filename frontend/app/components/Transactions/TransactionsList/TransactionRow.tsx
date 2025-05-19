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
import { toObjectErrors } from "~/components/Common/formUtils";

const transactionSchema = z.object({
  accountId: z.string().min(1),
  date: z.string().datetime(),
  payeeId: z.string().uuid().nullable(),
  categoryId: z.string().uuid().nullable(),
  notes: z.string(),
  amount: z.coerce.number(),
  isReconciled: z.boolean(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const TransactionRow = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  const { accountId } = useAccountTransactions();

  const [errors, setErrors] = useState<
    Partial<Record<keyof Transaction, string>>
  >({});

  const transactionAmount = transaction.amount || null;

  const { mutateAsync: updateTransaction } = useUpdateTransaction(accountId);

  const saveChanges = async (changes: Partial<Transaction>) => {
    const result = transactionSchema
      .omit({ accountId: true })
      .partial()
      .safeParse({ ...changes });

    if (!result.success) {
      setErrors(toObjectErrors(result.error));
      console.log(result.error);
      console.log({ ...changes });
      return;
    }

    await updateTransaction({
      transactionId: transaction.id,
      transaction: result.data,
    });
  };

  return (
    <>
      <div className="flex flex-row text-sm">
        <TransactionDateCell
          value={transaction.date}
          onChange={(date) => {
            saveChanges({ date });
          }}
          error={errors.date}
        />
        <TransactionPayeeCell
          value={transaction.payeeId || null}
          onChange={(payeeId) => {
            saveChanges({ payeeId });
          }}
        />
        <TransactionCategoryCell
          value={transaction.categoryId || null}
          onChange={(categoryId) => {
            saveChanges({ categoryId });
          }}
        />
        <TransactionNotesCell
          value={transaction.notes || null}
          onChange={(notes) => {
            saveChanges({ notes });
          }}
        />
        <TransactionPaymentDepositCell
          rawValue={
            transactionAmount != null && transactionAmount <= 0
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
          className="flex items-center justify-center"
        >
          <input
            type="checkbox"
            title="Reconciled"
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
    categoryId: null,
    notes: "",
    date: formatISO(new Date()),
    amount: 0,
    isReconciled: true,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof Transaction, string>>
  >({});

  const transactionAmount = newTransaction.amount || null;

  const { mutateAsync: createTransaction, isPending } =
    useCreateTransaction(accountId);

  const onSave = async () => {
    const result = transactionSchema.safeParse(newTransaction);

    if (!result.success) {
      setErrors(toObjectErrors(result.error));
      console.log(result.error);
      return;
    }

    await createTransaction(result.data);
    onClose();
  };

  return (
    <>
      <div className="flex flex-row text-sm">
        <TransactionDateCell
          value={newTransaction.date}
          onChange={(date) => {
            setNewTransaction({ ...newTransaction, date });
          }}
          error={errors.date}
          autoFocus
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
          className="flex items-center justify-center"
        >
          <input
            type="checkbox"
            title="Reconciled"
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
