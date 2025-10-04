import { useState } from "react";
import { useConnectAccounts } from "../Plaid/PlaidQueries";
import { AccountTypeSelectionModal } from "./AccountTypeSelectionModal";
import { CreateUnlinkedAccountModal } from "./CreateUnlinkedAccountModal";
import { useToast } from "../Common/ToastContext";

type AccountType = "unlinked" | "linked";

enum Step {
  SELECT_TYPE = "select-type",
  CREATE_UNLINKED = "create-unlinked",
}

export const CreateAccountModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<Step>(Step.SELECT_TYPE);

  const handleAccountTypeSelect = (type: AccountType) => {
    if (type === "unlinked") {
      setStep(Step.CREATE_UNLINKED);
    }
  };

  const { mutateAsync: connectAccounts } = useConnectAccounts();
  const { setToast } = useToast();

  const handlePlaidSuccess = async (publicToken: string, _metadata: any) => {
    try {
      await connectAccounts({ publicToken: publicToken });
      setToast("Bank accounts connected successfully!", "success");
      onClose();
    } catch (error) {
      console.error("Error with Plaid:", error);
      setToast("Failed to connect to your bank account", "error");
    }
  };

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
};
