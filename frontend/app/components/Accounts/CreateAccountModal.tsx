import { useState } from "react";
import { useExchangeToken } from "../Plaid/PlaidQueries";
import { AccountTypeSelectionModal } from "./AccountTypeSelectionModal";
import { CreateUnlinkedAccountModal } from "./CreateUnlinkedAccountModal";
import { SelectPlaidAccountsModal } from "./SelectPlaidAccountsModal";
import { useToast } from "../Common/ToastContext";
import type { PlaidLinkedAccount } from "~/api/models";

type AccountType = "unlinked" | "linked";

enum Step {
  SELECT_TYPE = "select-type",
  CREATE_UNLINKED = "create-unlinked",
  SELECT_ACCOUNT = "select-account",
}

export const CreateAccountModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<Step>(Step.SELECT_TYPE);
  const [availableAccounts, setAvailableAccounts] = useState<
    PlaidLinkedAccount[]
  >([]);

  const handleAccountTypeSelect = (type: AccountType) => {
    if (type === "unlinked") {
      setStep(Step.CREATE_UNLINKED);
    }
  };

  const { mutateAsync: exchangeToken } = useExchangeToken();

  const handlePlaidSuccess = async (publicToken: string, _metadata: any) => {
    try {
      const response = await exchangeToken({ publicToken: publicToken });
      setAvailableAccounts(response.availableAccounts);
      setStep(Step.SELECT_ACCOUNT);
    } catch (error) {
      console.error("Error with Plaid:", error);
      setToast("Failed to connect to your bank account", "error");
    }
  };

  const { setToast } = useToast();

  const handlePlaidExit = () => {
    setToast("There was an error linking your account", "error");
  };

  const handleBack = () => {
    setStep(Step.SELECT_TYPE);
  };

  if (step === Step.SELECT_TYPE) {
    return (
      <AccountTypeSelectionModal
        onClose={onClose}
        onAccountTypeSelect={handleAccountTypeSelect}
        onPlaidSuccess={handlePlaidSuccess}
        onPlaidExit={handlePlaidExit}
      />
    );
  }

  if (step === Step.CREATE_UNLINKED) {
    return <CreateUnlinkedAccountModal onClose={onClose} onBack={handleBack} />;
  }

  if (step === Step.SELECT_ACCOUNT) {
    return (
      <SelectPlaidAccountsModal
        onClose={onClose}
        onBack={handleBack}
        availableAccounts={availableAccounts}
      />
    );
  }
};
