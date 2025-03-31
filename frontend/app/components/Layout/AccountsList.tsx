import { useState } from "react";
import { useAccounts, useCreateAccount } from "../AccountsQueries";
import Amount from "../Amount";
import { Modal } from "../Common/Modal";

export const AccountsList = () => {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading || !accounts) return null;

  return (
    <>
      {accounts.map((account) => (
        <li key={account.id}>
          <div className="flex justify-between items-baseline">
            <a>{account.name}</a>
            <Amount amount={1000.0} />
          </div>
        </li>
      ))}
    </>
  );
};

export const CreateAccountModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(true);
  const { mutate: createAccount, isPending } = useCreateAccount();

  const handleSave = () => {
    if (!name) {
      setIsValid(false);
      return;
    }

    createAccount({ name });
    onClose();
  };

  return (
    <Modal
      title="Create Account"
      onClose={onClose}
      onSave={handleSave}
      disabled={isPending}
    >
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
    </Modal>
  );
};
