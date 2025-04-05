import { useState } from "react";
import { Modal } from "../Common/Modal";
import { useUpdateAccount } from "./AccountsQueries";
import type { BudgetAccount } from "~/api/models";

type EditAccountModalProps = {
  onClose: () => void;
  account: BudgetAccount;
};

export const EditAccountModal = ({
  onClose,
  account,
}: EditAccountModalProps) => {
  const [name, setName] = useState(account.name);
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: updateAccount, isPending } = useUpdateAccount();

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name) {
      setIsValid(false);
      return;
    }

    await updateAccount({ id: account.id, name });
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Edit Account"
      onSave={handleSave}
      disabled={isPending}
    >
      <form onSubmit={handleSave}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Account name</legend>
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
