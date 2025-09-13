import { useState } from "react";
import { Modal } from "../Common/Modal";
import { useCreateAccount } from "./AccountsQueries";

type AccountType = "unlinked" | "linked";

export const CreateAccountModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<"select-type" | "create-unlinked">(
    "select-type"
  );
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: createAccount, isPending } = useCreateAccount();

  const handleAccountTypeSelect = (type: AccountType) => {
    if (type === "unlinked") {
      setStep("create-unlinked");
    } else {
      // TODO: Start Plaid link process
      console.log("Starting Plaid link process...");
      onClose();
    }
  };

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name) {
      setIsValid(false);
      return;
    }

    await createAccount({ name });
    onClose();
  };

  const handleBack = () => {
    setStep("select-type");
    setName("");
    setIsValid(true);
  };

  if (step === "select-type") {
    return (
      <Modal onClose={onClose} title="Create Account">
        <div className="space-y-4">
          <p className="text-sm text-base-content/70">
            Choose how you want to create your account
          </p>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => handleAccountTypeSelect("linked")}
              className="card bg-primary/5 border-2 border-primary hover:bg-primary/10 transition-colors p-6 text-left relative cursor-pointer"
            >
              <div className="absolute top-3 right-3">
                <div className="badge badge-primary badge-sm">Recommended</div>
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
            </button>

            <button
              type="button"
              onClick={() => handleAccountTypeSelect("unlinked")}
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
  }

  return (
    <Modal
      onClose={onClose}
      title="Create Unlinked Account"
      onSave={handleSave}
      disabled={isPending}
      onBack={handleBack}
    >
      <form onSubmit={handleSave}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Your account name</legend>
          <input
            type="text"
            className="input"
            placeholder="Like Cash or Revolut"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {!isValid && <div className="text-error">Enter an account name</div>}
        </fieldset>
      </form>
    </Modal>
  );
};
