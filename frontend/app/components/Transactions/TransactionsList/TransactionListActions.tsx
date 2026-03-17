import { ArrowUpTrayIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { ReconcileButton } from "../ReconcileButton";

export type TransactionListActionsProps = {
  onAddTransaction: () => void;
  onImport: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
};

export const TransactionListActions = ({
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
        <ReconcileButton />
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
