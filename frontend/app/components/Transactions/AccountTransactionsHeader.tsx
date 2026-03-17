import {
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { BudgetAccount } from "~/api/models";
import { useAccounts } from "../Accounts/AccountsQueries";
import { DeleteAccountModal } from "../Accounts/DeleteAccountModal";
import { EditAccountModal } from "../Accounts/EditAccountModal";
import Amount from "../Amount";
import { Tooltip } from "../Common/Tooltip";
import { useSyncPlaidAccount } from "../Plaid/PlaidQueries";
import { CsvImportModal } from "./CsvImportModal";
import { ReconciliationBanner } from "./ReconciliationBanner";
import { useReconciliation } from "./ReconciliationContext";
import type { TransactionListActionsProps } from "./TransactionsList/TransactionListActions";
import { TransactionListActions } from "./TransactionsList/TransactionListActions";
import { TransactionListHeader } from "./TransactionsList/TransactionListHeader";
import { useTransactions } from "./TransactionsQueries";

type AccountTransactionsHeaderProps = Omit<
  TransactionListActionsProps,
  "onImport"
> & {
  accountId: string;
  onSelectAll: (selected: boolean) => void;
};

export const AccountTransactionsHeader = ({
  accountId,
  onAddTransaction,
  selectedCount,
  onDeleteSelected,
  onSelectAll,
}: AccountTransactionsHeaderProps) => {
  const { data: transactions = [] } = useTransactions(accountId);
  const [editingAccount, setEditingAccount] = useState<BudgetAccount | null>(
    null,
  );
  const [deletingAccount, setDeletingAccount] = useState<BudgetAccount | null>(
    null,
  );
  const [importingCsv, setImportingCsv] = useState(false);

  const { data: accounts } = useAccounts();
  const syncPlaidAccount = useSyncPlaidAccount();
  const navigate = useNavigate();
  const { isReconciling } = useReconciliation();

  const account = accounts?.find((account) => account.id === accountId);

  const handleSync = () => {
    syncPlaidAccount.mutate({ accountId });
  };

  const handleAccountDeleted = () => {
    setDeletingAccount(null);
    navigate("/");
  };

  if (!account) return null;

  return (
    <div className="sticky top-0 z-10 bg-base-100">
      <div className="py-5 px-6">
        <div className="flex gap-2 items-center group">
          <h1 className="text-2xl font-bold">{account.name}</h1>
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
                className={`text-secondary size-4 ${syncPlaidAccount.isPending ? "animate-spin" : ""}`}
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
          <Amount className="text-lg font-bold" amount={account.balance} />
        </h2>
      </div>

      <TransactionListActions
        onAddTransaction={onAddTransaction}
        onImport={() => setImportingCsv(true)}
        selectedCount={selectedCount}
        onDeleteSelected={onDeleteSelected}
      />

      {isReconciling && <ReconciliationBanner transactions={transactions} />}

      <TransactionListHeader
        selectedCount={selectedCount}
        totalCount={transactions.length}
        onSelectAll={onSelectAll}
      />

      {importingCsv && (
        <CsvImportModal onClose={() => setImportingCsv(false)} />
      )}

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
