import { useParams } from "react-router";
import { useTransactions } from "./TransactionsQueries";
import { useAccounts } from "../Accounts/AccountsQueries";
import type { BudgetAccount, Transaction } from "~/api/models";
import Amount from "../Amount";
import { useState } from "react";
import { PencilIcon } from "@heroicons/react/16/solid";
import { EditAccountModal } from "../Accounts/EditAccountModal";
import { AccountTransactionsList } from "./TransactionsList/TransactionsList";
import { AccountTransactionsContextProvider } from "./AccountTransactionsContext";

const AccountTransactionsHeader = ({ accountId }: { accountId: string }) => {
  const [editingAccount, setEditingAccount] = useState<BudgetAccount | null>(
    null
  );

  const { data: accounts } = useAccounts();

  const account = accounts?.find((account) => account.id === accountId);

  if (!account) return null;

  return (
    <div className="py-5 px-6">
      <div className="flex gap-2 items-center">
        <h1 className="text-2xl font-bold">{account?.name}</h1>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setEditingAccount(account)}
        >
          <PencilIcon className="text-secondary size-4" />
        </button>
      </div>
      <h2>{<Amount className="text-lg font-bold" amount={10_00} />}</h2>

      {editingAccount && (
        <EditAccountModal
          onClose={() => setEditingAccount(null)}
          account={editingAccount}
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
