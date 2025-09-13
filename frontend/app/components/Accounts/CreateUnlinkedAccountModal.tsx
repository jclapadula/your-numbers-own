import { useState } from "react";
import { Modal } from "../Common/Modal";
import { useCreateAccount } from "./AccountsQueries";

interface CreateUnlinkedAccountModalProps {
  onClose: () => void;
  onBack: () => void;
}

export const CreateUnlinkedAccountModal = ({
  onClose,
  onBack,
}: CreateUnlinkedAccountModalProps) => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: createAccount, isPending } = useCreateAccount();

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name) {
      setIsValid(false);
      return;
    }

    await createAccount({ name });
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Create Unlinked Account"
      onSave={handleSave}
      disabled={isPending}
      onBack={onBack}
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
          {!isValid && (
            <div className="text-error">Enter an account name</div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
};