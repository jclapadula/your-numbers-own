import type { BudgetAccount } from "~/api/models";
import { useAccounts } from "../Accounts/AccountsQueries";
import { EditAccountModal } from "../Accounts/EditAccountModal";
import Amount from "../Amount";
import { useState } from "react";
import { PencilIcon } from "@heroicons/react/16/solid";
export const AccountsList = () => {
  const { data: accounts, isLoading } = useAccounts();
  const [editingAccount, setEditingAccount] = useState<BudgetAccount | null>(
    null
  );

  if (isLoading || !accounts) return null;

  return (
    <>
      {accounts.map((account) => (
        <li key={account.id} className="group">
          <div className="flex justify-between items-baseline">
            <div className="flex gap-2 items-baseline">
              <a>{account.name}</a>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => setEditingAccount(account)}
              >
                <PencilIcon className="text-secondary size-4 invisible group-hover:visible" />
              </button>
            </div>
            <Amount amount={1000.0} />
          </div>
        </li>
      ))}
      {editingAccount && (
        <EditAccountModal
          onClose={() => setEditingAccount(null)}
          account={editingAccount}
        />
      )}
    </>
  );
};
