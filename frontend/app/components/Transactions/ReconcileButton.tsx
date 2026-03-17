import { ScaleIcon } from "@heroicons/react/16/solid";
import { useRef, useState } from "react";
import { rawNumberToAmount } from "~/components/Amount";
import { useAccounts } from "../Accounts/AccountsQueries";
import { useAccountTransactions } from "./AccountTransactionsContext";
import { useReconciliation } from "./ReconciliationContext";

export const ReconcileButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { startReconciliation, isReconciling } = useReconciliation();
  const { accountId } = useAccountTransactions();
  const { data: accounts } = useAccounts();
  const account = accounts?.find((a) => a.id === accountId);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    const prefill = account ? (account.balance / 100).toFixed(2) : "";
    setInputValue(prefill);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleStart = () => {
    const dollars = parseFloat(inputValue);
    if (isNaN(dollars)) return;
    const bankBalance = rawNumberToAmount(dollars);
    startReconciliation(bankBalance);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleStart();
    if (e.key === "Escape") setIsOpen(false);
  };

  if (isReconciling) return null;

  return (
    <div className="relative">
      <button className="btn btn-sm btn-outline" onClick={handleOpen}>
        <ScaleIcon className="size-4" />
        Reconcile
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 bg-base-200 border border-base-content/10 rounded-box shadow-lg p-4 w-64">
            <p className="text-sm font-semibold mb-2">Bank account balance</p>
            <input
              ref={inputRef}
              type="text"
              className="input input-sm input-bordered w-full mb-3"
              placeholder="0.00"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleStart}
                disabled={inputValue === "" || isNaN(parseFloat(inputValue))}
              >
                Start Reconciling
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
