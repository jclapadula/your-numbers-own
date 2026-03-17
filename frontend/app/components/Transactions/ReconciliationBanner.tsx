import { formatISO } from "date-fns";
import type { Transaction } from "~/api/models";
import Amount from "../Amount";
import { useAccountTransactions } from "./AccountTransactionsContext";
import { useReconciliation } from "./ReconciliationContext";
import {
  useCreateTransaction,
  useReconcileTransactions,
} from "./TransactionsQueries";

function computeClearedBalance(
  pendingIds: Set<string>,
  transactions: Transaction[],
) {
  const reconciledBalance = transactions
    .filter((t) => t.isReconciled)
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingSum = transactions
    .filter((t) => pendingIds.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0);
  return reconciledBalance + pendingSum;
}

export function ReconciliationBanner({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const {
    reconciliationBankBalance,
    reconciliationPendingIds,
    cancelReconciliation,
    addReconciliationPending,
  } = useReconciliation();
  const { accountId } = useAccountTransactions();

  const { mutateAsync: reconcile, isPending: isReconciling } =
    useReconcileTransactions(accountId);
  const { mutateAsync: createTransaction, isPending: isCreating } =
    useCreateTransaction(accountId);

  const clearedBalance = computeClearedBalance(
    reconciliationPendingIds,
    transactions,
  );
  const difference = reconciliationBankBalance - clearedBalance;
  const isBalanced = difference === 0;

  const handleFinish = async () => {
    await reconcile(Array.from(reconciliationPendingIds));
    cancelReconciliation();
  };

  const handleCreateAdjustment = async () => {
    const result = await createTransaction({
      accountId,
      date: formatISO(new Date()),
      amount: difference,
      payeeId: null,
      categoryId: null,
      notes: "Reconciliation adjustment",
      isReconciled: false,
    });
    if (result && typeof result === "object" && "id" in result) {
      addReconciliationPending((result as { id: string }).id);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-base-200 border-b border-base-content/10 text-sm">
      <div className="flex gap-6">
        <span>
          Cleared balance:{" "}
          <Amount
            className="font-semibold whitespace-nowrap"
            amount={clearedBalance}
          />
        </span>
        <span>
          Bank balance:{" "}
          <Amount
            className="font-semibold whitespace-nowrap"
            amount={reconciliationBankBalance}
          />
        </span>
        <span>
          Difference:{" "}
          <Amount
            className={`font-semibold whitespace-nowrap ${isBalanced ? "text-success" : "text-warning"}`}
            amount={difference}
          />
        </span>
      </div>
      <div className="flex gap-2">
        <button
          className="btn btn-sm btn-ghost"
          onClick={cancelReconciliation}
          disabled={isReconciling || isCreating}
        >
          Cancel
        </button>
        {isBalanced ? (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleFinish}
            disabled={isReconciling}
          >
            Finish Reconciliation
          </button>
        ) : (
          <button
            className="btn btn-sm btn-outline"
            onClick={handleCreateAdjustment}
            disabled={isCreating}
          >
            Create Adjustment Transaction
          </button>
        )}
      </div>
    </div>
  );
}
