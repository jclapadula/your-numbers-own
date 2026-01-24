import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { useCreatePayee, usePayees } from "../budgetQueries";
import { useAccounts } from "../../Accounts/AccountsQueries";
import { useDropdownArrowNavigation } from "../../Common/useDropdownArrowNavigation";
import type { PayeeOrTransfer } from "~/types";

type PayeeInputProps = {
  payeeId: string | null;
  destinationAccountId: string | null;
  currentAccountId: string;
  onSelectionChange: (selection: PayeeOrTransfer) => void;
  onBlur: () => void;
  className?: string;
};

export const PayeeInput = ({
  payeeId,
  destinationAccountId,
  currentAccountId,
  onSelectionChange,
  onBlur,
  className,
}: PayeeInputProps) => {
  const { data: payees = [] } = usePayees();
  const { data: accounts = [] } = useAccounts();
  const { mutateAsync: createPayee } = useCreatePayee();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPayees = useMemo(
    () =>
      payees.filter((payee) =>
        payee.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [payees, searchTerm],
  );

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.id !== currentAccountId)
        .filter((account) =>
          account.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    [accounts, currentAccountId, searchTerm],
  );

  const navigationItems = useMemo(
    () => [
      ...filteredPayees.map((p) => ({ id: p.id, name: p.name })),
      ...filteredAccounts.map((a) => ({ id: a.id, name: a.name })),
    ],
    [filteredPayees, filteredAccounts],
  );

  const divRef = useRef<HTMLDivElement>(null);

  const {
    setFocusedItemIndex,
    focusOnNextElement,
    focusOnPreviousElement,
    resetArrowsFocus,
  } = useDropdownArrowNavigation({
    items: navigationItems,
    dataAttribute: "data-itemId",
    containerRef: divRef,
  });

  const handleCreatePayee = async () => {
    if (!searchTerm.trim()) {
      onSelectionChange(null);
      return;
    }

    const existingPayee = payees.find((p) => p.name === searchTerm);
    if (existingPayee) {
      onSelectionChange({ type: "payee", payeeId: existingPayee.id });
      return;
    }

    const newPayee = await createPayee(searchTerm);

    onSelectionChange({ type: "payee", payeeId: newPayee.id });
  };

  const handleBlur = useCallback(() => {
    onBlur();
    resetArrowsFocus();
  }, [onBlur, resetArrowsFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        divRef.current !== event.target &&
        !divRef.current?.contains(event.target as Node)
      ) {
        handleBlur();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleBlur]);

  useEffect(() => {
    const initialPayee = payees.find((p) => p.id === payeeId);
    const initialAccount = accounts.find((a) => a.id === destinationAccountId);
    setSearchTerm(initialPayee?.name || initialAccount?.name || "");
  }, [payeeId, destinationAccountId, payees, accounts]);

  const hasPayees = filteredPayees.length > 0;
  const hasAccounts = filteredAccounts.length > 0;

  return (
    <div
      className={twMerge("dropdown", className)}
      ref={divRef}
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          handleBlur();
        }
        if (e.key === "ArrowDown") {
          focusOnNextElement();
        }
        if (e.key === "ArrowUp") {
          focusOnPreviousElement();
        }
        if (e.key === "Escape") {
          handleBlur();
        }
      }}
    >
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        placeholder="Search payees or accounts..."
        className="input input-bordered w-full h-auto pl-0"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleCreatePayee();
          }
        }}
        autoFocus
      />
      <ul
        className={twMerge(
          "dropdown-content menu p-0 shadow bg-base-300 rounded overflow-hidden mt-1 w-max max-w-xs min-w-full",
        )}
      >
        {hasPayees && (
          <Fragment>
            <li className="menu-disabled -ml-1 !text-base-content/50">
              <span className="text-[13px]">Payees</span>
            </li>
            {filteredPayees.map((payee) => {
              const itemIndex = navigationItems.findIndex(
                (item) => item.id === payee.id,
              );
              return (
                <li key={payee.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectionChange({ type: "payee", payeeId: payee.id });
                    }}
                    onFocus={() => setFocusedItemIndex(itemIndex)}
                    data-itemId={payee.id}
                    className="text-[13px]"
                  >
                    {payee.name}
                  </button>
                </li>
              );
            })}
          </Fragment>
        )}

        {hasAccounts && (
          <Fragment>
            <li className="menu-disabled -ml-1 !text-base-content/50">
              <span className="text-[13px]">Accounts</span>
            </li>
            {filteredAccounts.map((account) => {
              const itemIndex = navigationItems.findIndex(
                (item) => item.id === account.id,
              );
              return (
                <li key={account.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectionChange({
                        type: "transfer",
                        destinationAccountId: account.id,
                      });
                    }}
                    onFocus={() => setFocusedItemIndex(itemIndex)}
                    data-itemId={account.id}
                    className="text-[13px]"
                  >
                    {account.name}
                  </button>
                </li>
              );
            })}
          </Fragment>
        )}

        {searchTerm.trim() &&
          !filteredPayees.some(
            (p) => p.name.toLowerCase() === searchTerm.toLowerCase(),
          ) && (
            <li className="mt-1">
              <button
                onClick={handleCreatePayee}
                className="btn btn-primary btn-sm text-left"
              >
                Create "{searchTerm}"
              </button>
            </li>
          )}
      </ul>
    </div>
  );
};
