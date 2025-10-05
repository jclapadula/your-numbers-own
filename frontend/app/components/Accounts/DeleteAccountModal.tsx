import { useState } from "react";
import { Modal } from "../Common/Modal";
import { useDeleteAccount } from "./AccountsQueries";
import type { BudgetAccount } from "~/api/models";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type DeleteAccountModalProps = {
  onClose: () => void;
  account: BudgetAccount;
  onDeleted: () => void;
};

export const DeleteAccountModal = ({
  onClose,
  account,
  onDeleted,
}: DeleteAccountModalProps) => {
  const [confirmText, setConfirmText] = useState("");
  const { mutateAsync: deleteAccount, isPending } = useDeleteAccount();

  const isConfirmed = confirmText === account.name;

  const handleDelete = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!isConfirmed) return;

    await deleteAccount(account.id);
    onDeleted();
  };

  return (
    <Modal
      onClose={onClose}
      title="Delete Account"
      onSave={handleDelete}
      onSaveDisabled={isPending || !isConfirmed}
      saveButtonText="Delete Account"
      saveButtonClass="btn-error"
    >
      <form onSubmit={handleDelete}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-warning flex-shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-warning mb-1">
                This action cannot be undone
              </div>
              <div>
                Deleting this account will hide it from your budget. If this
                account has transactions, it may affect your balance
                calculations.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              To confirm deletion, please type the account name:{" "}
              <span className="font-semibold">{account.name}</span>
            </p>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter account name to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
