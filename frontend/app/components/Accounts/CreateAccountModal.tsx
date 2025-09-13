import { useState } from "react";
import { useExchangeToken } from "../Plaid/PlaidQueries";
import { AccountTypeSelectionModal } from "./AccountTypeSelectionModal";
import { CreateUnlinkedAccountModal } from "./CreateUnlinkedAccountModal";
import { SelectAccountModal } from "./SelectAccountModal";
import { useToast } from "../Common/ToastContext";

type AccountType = "unlinked" | "linked";

enum Step {
  SELECT_TYPE = "select-type",
  CREATE_UNLINKED = "create-unlinked",
  SELECT_ACCOUNT = "select-account",
}

export const CreateAccountModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<Step>(Step.SELECT_TYPE);

  const handleAccountTypeSelect = (type: AccountType) => {
    if (type === "unlinked") {
      setStep(Step.CREATE_UNLINKED);
    }
  };

  const { mutateAsync: exchangeToken } = useExchangeToken();

  const handlePlaidSuccess = async (publicToken: string, _metadata: any) => {
    try {
      await exchangeToken({ publicToken: publicToken });
      onClose();
    } catch (error) {
      console.error("Error with Plaid:", error);
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
    return <SelectAccountModal onClose={onClose} />;
  }
};
