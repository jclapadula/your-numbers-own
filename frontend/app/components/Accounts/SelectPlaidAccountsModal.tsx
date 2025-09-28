import { useState } from "react";
import { Modal } from "../Common/Modal";
import type { PlaidLinkedAccount } from "~/api/models";
import { useConnectPlaidAccounts } from "../Plaid/PlaidQueries";

interface SelectAccountModalProps {
  onClose: () => void;
  onBack: () => void;
  availableAccounts: PlaidLinkedAccount[];
  onSuccess?: () => void;
}

export const SelectPlaidAccountsModal = ({
  onClose,
  onBack,
  availableAccounts,
  onSuccess,
}: SelectAccountModalProps) => {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    new Set()
  );
  const connectAccountsMutation = useConnectPlaidAccounts();

  const handleToggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccountIds);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccountIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAccountIds.size === availableAccounts.length) {
      setSelectedAccountIds(new Set());
    } else {
      setSelectedAccountIds(
        new Set(availableAccounts.map((acc) => acc.plaid_account_id))
      );
    }
  };

  const handleLinkSelected = async () => {
    const plaidAccountIds = Array.from(selectedAccountIds);

    try {
      await connectAccountsMutation.mutateAsync({
        plaidAccountIds,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to connect accounts:", error);
    }
  };

  const getAccountTypeDisplay = (account: PlaidLinkedAccount) => {
    const type = account.account_type;
    const subtype = account.account_subtype;

    if (subtype) {
      return subtype;
    }
    return type;
  };

  return (
    <Modal
      onClose={onClose}
      onBack={onBack}
      title="Select Accounts to Link"
      onSave={handleLinkSelected}
      onSaveDisabled={
        selectedAccountIds.size === 0 || connectAccountsMutation.isPending
      }
      saveButtonText={
        connectAccountsMutation.isPending ? "Connecting..." : "Connect"
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-base-content/70">
            Choose which accounts you'd like to connect to Your Numbers
          </p>
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-sm btn-ghost"
          >
            {selectedAccountIds.size === availableAccounts.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {availableAccounts.map((account) => {
            const isSelected = selectedAccountIds.has(account.plaid_account_id);

            return (
              <div
                key={account.plaid_account_id}
                className={`card border cursor-pointer transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50"
                }`}
                onClick={() => handleToggleAccount(account.plaid_account_id)}
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        handleToggleAccount(account.plaid_account_id)
                      }
                      className="checkbox checkbox-primary"
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex-1">
                      <h3 className="font-medium text-base">
                        {account.account_name}
                      </h3>
                      <p className="text-sm text-base-content/60 capitalize">
                        {getAccountTypeDisplay(account)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {availableAccounts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-base-content/60">
              No accounts available to link
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
