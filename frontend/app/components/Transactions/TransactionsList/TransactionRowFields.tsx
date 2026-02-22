import { format, formatISO } from "date-fns";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { Transaction } from "~/api/models";
import { useAccounts } from "~/components/Accounts/AccountsQueries";
import Amount, { rawValueToString } from "~/components/Amount";
import { usePayees } from "~/components/Budget/budgetQueries";
import { useCategories } from "~/components/Budget/Categories/CategoriesQueries";
import { CategorySelect } from "~/components/Budget/Inputs/CategorySelect";
import { PayeeInput } from "~/components/Budget/Inputs/PayeeInput";
import type { PayeeOrTransfer } from "~/types";
import { evaluateMathInput } from "~/utils/mathEval";
import { RowCell } from "./RowCell";
import { TransactionTableWidths } from "./TransactionListHeader";
import { useTransactionCellNavigation } from "./useTransactionCellNavigation";

type TransactionDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

export const TransactionDateCell = ({
  value,
  onChange,
  autoFocus = false,
}: TransactionDateFieldProps) => {
  const [isFocused, setIsFocused] = useState(autoFocus);
  const { cellProps, getInputKeyDownHandler } = useTransactionCellNavigation(0);

  const displayValue = new Date(value).toLocaleDateString();

  return (
    <RowCell
      {...cellProps}
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
      style={TransactionTableWidths.date}
      className={"px-2 py-1"}
    >
      {isFocused && (
        <input
          type="date"
          className={twMerge("input px-0 h-auto outline-none!")}
          value={format(new Date(value), "yyyy-MM-dd")}
          onChange={(e) => {
            const date = new Date(e.target.value);
            return onChange(formatISO(date));
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={getInputKeyDownHandler(() => setIsFocused(false))}
          autoFocus
        />
      )}
      {!isFocused && <span className="inline-block">{displayValue}</span>}
    </RowCell>
  );
};

type PayeeFieldChanges =
  | {
      payeeId: string | null;
      destinationAccountId: null;
    }
  | {
      payeeId: null;
      destinationAccountId: string | null;
    }
  | {
      payeeId: null;
      destinationAccountId: null;
    };

type TransactionPayeeFieldProps = {
  transaction: Pick<
    Transaction,
    "payeeId" | "accountId" | "destinationAccountId" | "amount"
  >;
  onChange: (changes: PayeeFieldChanges) => void;
};

export const TransactionPayeeCell = ({
  transaction,
  onChange,
}: TransactionPayeeFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { data: payees = [] } = usePayees();
  const { data: accounts = [] } = useAccounts();
  const { cellProps, getDropdownKeyDownHandler } =
    useTransactionCellNavigation(1);

  const payee = payees.find((p) => p.id === transaction.payeeId);
  const account = accounts.find(
    (a) => a.id === transaction.destinationAccountId,
  );

  const handleChange = (selection: PayeeOrTransfer) => {
    if (selection === null) {
      onChange({ payeeId: null, destinationAccountId: null });
    } else if (selection.type === "payee") {
      onChange({ payeeId: selection.payeeId, destinationAccountId: null });
    } else {
      onChange({
        destinationAccountId: selection.destinationAccountId,
        payeeId: null,
      });
    }
    setIsFocused(false);
  };

  useEffect(() => {
    setIsFocused(false);
  }, [transaction.payeeId, transaction.destinationAccountId]);

  const direction = transaction.amount < 0 ? "to" : "from";
  const displayValue = account
    ? `Transfer ${direction} ${account.name}`
    : payee?.name || "--";

  return (
    <RowCell
      {...cellProps}
      grows
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(true);
      }}
      onFocus={() => setIsFocused(true)}
      style={TransactionTableWidths.payee}
    >
      {isFocused ? (
        <div onKeyDown={getDropdownKeyDownHandler()}>
          <PayeeInput
            payeeId={transaction.payeeId}
            destinationAccountId={transaction.destinationAccountId}
            currentAccountId={transaction.accountId}
            onSelectionChange={handleChange}
            onBlur={() => setIsFocused(false)}
            className="w-full h-full"
          />
        </div>
      ) : (
        <span className="block w-full">{displayValue}</span>
      )}
    </RowCell>
  );
};

type TransactionCategoryFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const TransactionCategoryCell = ({
  value,
  onChange,
  disabled = false,
}: TransactionCategoryFieldProps) => {
  const { cellProps, getDropdownKeyDownHandler } =
    useTransactionCellNavigation(2);

  const [isFocused, setIsFocused] = useState(false);
  const { data: categories = [] } = useCategories();

  const category = categories.find((c) => c.id === value);

  const handleChange = (categoryId: string) => {
    onChange(categoryId);
    setIsFocused(false);
  };

  if (disabled) {
    return (
      <RowCell
        grows
        style={TransactionTableWidths.category}
        className="opacity-50"
      >
        <span className="block w-full text-base-content/50">--</span>
      </RowCell>
    );
  }

  return (
    <RowCell
      {...cellProps}
      grows
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(true);
      }}
      onFocus={() => setIsFocused(true)}
      style={TransactionTableWidths.category}
    >
      {isFocused ? (
        <div onKeyDown={getDropdownKeyDownHandler()}>
          <CategorySelect
            value={category?.name || ""}
            onCategorySelected={handleChange}
            onBlur={() => setIsFocused(false)}
            autoFocus
            containerRef={cellProps.ref}
          />
        </div>
      ) : category ? (
        <span className="block w-full">{category.name}</span>
      ) : (
        <span className="text-primary">Categorize</span>
      )}
    </RowCell>
  );
};

type TransactionNotesFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
};

export const TransactionNotesCell = ({
  value,
  onChange,
}: TransactionNotesFieldProps) => {
  const { cellProps, getInputKeyDownHandler } = useTransactionCellNavigation(3);
  const [isFocused, setIsFocused] = useState(false);
  const [notes, setNotes] = useState(value ?? "");

  const handleChange = (notes: string) => {
    setNotes(notes);
  };

  const handleBlur = () => {
    onChange(notes);
    setIsFocused(false);
  };

  useEffect(() => {
    setNotes(value ?? "");
  }, [value]);

  return (
    <RowCell
      {...cellProps}
      grows
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
      style={TransactionTableWidths.notes}
    >
      {isFocused ? (
        <input
          className="input w-full h-auto pl-0 outline-0!"
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          onKeyDown={getInputKeyDownHandler(() =>
            (document.activeElement as HTMLElement)?.blur(),
          )}
        />
      ) : (
        <span>{notes}</span>
      )}
    </RowCell>
  );
};

type TransactionPaymentDepositFieldProps = {
  rawValue: number | null;
  onChange: (value: number) => void;
  column: number;
};

export const TransactionPaymentDepositCell = ({
  rawValue,
  onChange,
  column,
}: TransactionPaymentDepositFieldProps) => {
  const { cellProps, getInputKeyDownHandler } =
    useTransactionCellNavigation(column);
  const [isFocused, setIsFocused] = useState(false);

  const initialValue = rawValueToString(rawValue);
  const [amount, setAmount] = useState(initialValue);

  useEffect(() => {
    setAmount(initialValue);
  }, [initialValue]);

  return (
    <RowCell
      {...cellProps}
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
      style={TransactionTableWidths.paymentDeposit}
    >
      {isFocused ? (
        <input
          className="input w-full h-auto pl-0 outline-0!"
          value={amount?.toString()}
          onChange={(e) => {
            setAmount(e.target.value);
          }}
          onBlur={(e) => {
            if (initialValue === amount) {
              setIsFocused(false);
              return;
            }

            const result = evaluateMathInput(e.target.value, rawValue || 0);
            onChange(result);
            setAmount(result.toString());
            setIsFocused(false);
          }}
          onKeyDown={getInputKeyDownHandler(() =>
            (document.activeElement as HTMLElement)?.blur(),
          )}
          accept="[0-9]*[.,]?[0-9]*"
          autoFocus
        />
      ) : (
        rawValue !== null && <Amount amount={rawValue} />
      )}
    </RowCell>
  );
};
