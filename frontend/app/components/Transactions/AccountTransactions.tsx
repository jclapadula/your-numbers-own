import { useParams, useNavigate } from "react-router";
import { useTransactions } from "./TransactionsQueries";
import { useAccounts } from "../Accounts/AccountsQueries";
import type { BudgetAccount, Transaction } from "~/api/models";
import Amount from "../Amount";
import { useState } from "react";
import {
  PencilIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { EditAccountModal } from "../Accounts/EditAccountModal";
import { DeleteAccountModal } from "../Accounts/DeleteAccountModal";
import { AccountTransactionsList } from "./TransactionsList/TransactionsList";
import { AccountTransactionsContextProvider } from "./AccountTransactionsContext";
import { useSyncPlaidAccount } from "../Plaid/PlaidQueries";
import { Tooltip } from "../Common/Tooltip";

const AccountTransactionsHeader = ({ accountId }: { accountId: string }) => {
  const [editingAccount, setEditingAccount] = useState<BudgetAccount | null>(
    null
  );
  const [deletingAccount, setDeletingAccount] = useState<BudgetAccount | null>(
    null
  );

  const { data: accounts } = useAccounts();
  const syncPlaidAccount = useSyncPlaidAccount();
  const navigate = useNavigate();

  const account = accounts?.find((account) => account.id === accountId);

  const handleSync = () => {
    syncPlaidAccount.mutate({ accountId });
  };

  const handleAccountDeleted = () => {
    setDeletingAccount(null);
    // Navigate back to a safe location since the account no longer exists
    navigate("/");
  };

  if (!account) return null;

  return (
    <div className="py-5 px-6">
      <div className="flex gap-2 items-center group">
        <h1 className="text-2xl font-bold">{account?.name}</h1>
        <Tooltip content="Rename account" position="bottom">
          <button
            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditingAccount(account)}
          >
            <PencilIcon className="text-secondary size-4" />
          </button>
        </Tooltip>
        <Tooltip content="Force sync" position="bottom">
          <button
            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSync}
            disabled={syncPlaidAccount.isPending}
          >
            <ArrowPathIcon
              className={`text-secondary size-4 ${
                syncPlaidAccount.isPending ? "animate-spin" : ""
              }`}
            />
          </button>
        </Tooltip>
        <Tooltip content="Delete account" position="bottom">
          <button
            className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setDeletingAccount(account)}
          >
            <TrashIcon className="text-error size-4" />
          </button>
        </Tooltip>
      </div>
      <h2>
        {<Amount className="text-lg font-bold" amount={account.balance} />}
      </h2>

      {editingAccount && (
        <EditAccountModal
          onClose={() => setEditingAccount(null)}
          account={editingAccount}
        />
      )}

      {deletingAccount && (
        <DeleteAccountModal
          onClose={() => setDeletingAccount(null)}
          account={deletingAccount}
          onDeleted={handleAccountDeleted}
        />
      )}
    </div>
  );
};

export default function AccountTransactions() {
  const { accountId = "" } = useParams();

  const { isLoading: isLoadingAccounts } = useAccounts();
  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactions(accountId);

  const sortedTransactions = transactions?.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (isLoadingTransactions || isLoadingAccounts)
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner text-primary w-10"></span>
      </div>
    );

  return (
    <AccountTransactionsContextProvider accountId={accountId}>
      <div className="flex flex-col h-full w-full">
        <AccountTransactionsHeader accountId={accountId} />
        <AccountTransactionsList transactions={sortedTransactions || []} />
      </div>
    </AccountTransactionsContextProvider>
  );
}
