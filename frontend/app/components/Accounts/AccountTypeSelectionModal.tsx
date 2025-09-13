import { Modal } from "../Common/Modal";
import { PlaidLink } from "../Plaid/PlaidLink";

type AccountType = "unlinked" | "linked";

interface AccountTypeSelectionModalProps {
  onClose: () => void;
  onAccountTypeSelect: (type: AccountType) => void;
  onPlaidSuccess: (publicToken: string, metadata: any) => void;
  onPlaidExit: () => void;
}

export const AccountTypeSelectionModal = ({
  onClose,
  onAccountTypeSelect,
  onPlaidSuccess,
  onPlaidExit,
}: AccountTypeSelectionModalProps) => {
  return (
    <Modal onClose={onClose} title="Create Account">
      <div className="space-y-4">
        <p className="text-sm text-base-content/70">
          Choose how you want to create your account
        </p>

        <div className="grid grid-cols-1 gap-4">
          <PlaidLink onSuccess={onPlaidSuccess} onExit={onPlaidExit}>
            <div className="card bg-primary/5 border-2 border-primary hover:bg-primary/10 transition-colors p-6 text-left relative cursor-pointer">
              <div className="absolute top-3 right-3">
                <div className="badge badge-primary badge-sm">
                  Recommended
                </div>
              </div>
              <div className="card-body p-0">
                <h3 className="card-title text-lg text-primary">
                  Linked Bank Account
                </h3>
                <p className="text-sm text-base-content/70">
                  Automatically sync transactions and balances from your bank.
                  Secure connection via Plaid.
                </p>
              </div>
            </div>
          </PlaidLink>

          <button
            type="button"
            onClick={() => onAccountTypeSelect("unlinked")}
            className="card bg-base-100 border border-base-300 hover:border-primary hover:bg-base-50 transition-colors p-6 text-left cursor-pointer"
          >
            <div className="card-body p-0">
              <h3 className="card-title text-lg">Unlinked Account</h3>
              <p className="text-sm text-base-content/70">
                Manually track balances and transactions. Perfect for cash
                accounts or when you prefer manual control.
              </p>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};