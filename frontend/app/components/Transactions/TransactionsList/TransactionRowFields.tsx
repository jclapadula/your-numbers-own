import { useEffect, useState } from "react";
import { useCategories, usePayees } from "~/components/Budget/budgetQueries";
import { CategoryInput } from "~/components/Budget/CategoryInput";
import { PayeeInput } from "~/components/Budget/PayeeInput";
import { TransactionTableWidths } from "./TransactionListHeader";
import Amount, { rawValueToString } from "~/components/Amount";
import { twMerge } from "tailwind-merge";
import { RowCell } from "./RowCell";
import { formatISO } from "date-fns";

type TransactionDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
};

export const TransactionDateCell = ({
  value,
  onChange,
  error,
  autoFocus = false,
}: TransactionDateFieldProps) => {
  const [isFocused, setIsFocused] = useState(autoFocus);

  const displayValue = new Date(value).toLocaleDateString();

  return (
    <RowCell
      onClick={() => setIsFocused(true)}
      style={TransactionTableWidths.date}
      className={"px-2 py-1"}
    >
      {isFocused && (
        <input
          type="date"
          className={twMerge(
            "input px-0 h-auto !outline-none",
            error && "input-error"
          )}
          value={value}
          onChange={(e) => {
            const date = new Date(e.target.value);
            return onChange(formatISO(date));
          }}
          onBlur={() => setIsFocused(false)}
          autoFocus
        />
      )}
      {!isFocused && <span className="inline-block">{displayValue}</span>}
    </RowCell>
  );
};

type TransactionPayeeFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
};

export const TransactionPayeeCell = ({
  value,
  onChange,
}: TransactionPayeeFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { data: payees = [] } = usePayees();

  const payee = payees.find((p) => p.id === value);

  const handleChange = (payeeId: string) => {
    onChange(payeeId);
    setIsFocused(false);
  };

  useEffect(() => {
    setIsFocused(false);
  }, [value]);

  return (
    <RowCell
      grows
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(true);
      }}
      onFocus={() => setIsFocused(true)}
    >
      {isFocused ? (
        <PayeeInput
          value={payee?.name || ""}
          onPayeeSelected={handleChange}
          onBlur={() => setIsFocused(false)}
          className="w-full h-full"
        />
      ) : (
        <span className="block w-full">{payee?.name || "--"}</span>
      )}
    </RowCell>
  );
};

type TransactionCategoryFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
};

export const TransactionCategoryCell = ({
  value,
  onChange,
}: TransactionCategoryFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { data: categories } = useCategories();

  const category = categories.find((c) => c.id === value);

  const handleChange = (categoryId: string) => {
    onChange(categoryId);
    setIsFocused(false);
  };

  return (
    <RowCell
      grows
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
    >
      {isFocused ? (
        <CategoryInput
          value={category?.name || ""}
          onCategorySelected={handleChange}
          onBlur={() => setIsFocused(false)}
        />
      ) : category ? (
        <span>{category.name}</span>
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
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (notes: string) => {
    onChange(notes);
  };

  return (
    <RowCell
      grows
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
    >
      {isFocused ? (
        <input
          className="input w-full h-auto pl-0 !outline-0"
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setIsFocused(false)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsFocused(false);
            }
          }}
        />
      ) : (
        <span>{value}</span>
      )}
    </RowCell>
  );
};

type TransactionPaymentDepositFieldProps = {
  rawValue: number | null;
  onChange: (value: number) => void;
};

export const TransactionPaymentDepositCell = ({
  rawValue,
  onChange,
}: TransactionPaymentDepositFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const initialValue = rawValueToString(rawValue);
  const [amount, setAmount] = useState(initialValue);

  useEffect(() => {
    setAmount(initialValue);
  }, [initialValue]);

  return (
    <RowCell
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
      style={TransactionTableWidths.paymentDeposit}
    >
      {isFocused ? (
        <input
          className="input w-full h-auto pl-0 !outline-0"
          value={amount?.toString()}
          onChange={(e) => {
            setAmount(e.target.value);
          }}
          onBlur={(e) => {
            if (initialValue === amount) {
              setIsFocused(false);
              return;
            }

            const valueAsNumber = Number(e.target.value);
            if (!isNaN(valueAsNumber)) {
              const roundedValue = Number(valueAsNumber.toFixed(2));
              onChange(roundedValue);
              setAmount(roundedValue.toString());
            }
            setIsFocused(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as any).blur();
            }
          }}
          accept="[0-9]*[.,]?[0-9]*"
          autoFocus
        />
      ) : (
        rawValue !== null && <Amount amount={rawValue} />
      )}
    </RowCell>
  );
};
