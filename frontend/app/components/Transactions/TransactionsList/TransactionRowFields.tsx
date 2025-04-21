import { useEffect, useState } from "react";
import { useCategories, usePayees } from "~/components/Budget/budgetQueries";
import { CategoryInput } from "~/components/Budget/CategoryInput";
import { PayeeInput } from "~/components/Budget/PayeeInput";
import { TransactionTableWidths } from "./TransactionListHeader";
import Amount, { rawStringToAmount } from "~/components/Amount";
type TransactionDateFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
};

export const TransactionDateCell = ({
  value,
  onChange,
}: TransactionDateFieldProps) => {
  const [isFocused, setIsFocused] = useState(true);

  const displayValue = value ? new Date(value).toLocaleDateString() : "";

  return (
    <td onClick={() => setIsFocused(true)} style={TransactionTableWidths.date}>
      {isFocused && (
        <input
          type="date"
          className="input p-1 pr-4 h-auto"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsFocused(false)}
          autoFocus
        />
      )}
      {!isFocused && (
        <span className="w-[123px] inline-block ml-1">{displayValue}</span>
      )}
    </td>
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
  const { data: payees } = usePayees();

  const payee = payees.find((p) => p.id === value);

  const handleChange = (payeeId: string) => {
    onChange(payeeId);
    setIsFocused(false);
  };

  useEffect(() => {
    setIsFocused(false);
  }, [value]);

  return (
    <td onClick={() => setIsFocused(true)}>
      {isFocused ? (
        <PayeeInput
          value={payee?.name || ""}
          onPayeeSelected={handleChange}
          onBlur={() => setIsFocused(false)}
        />
      ) : (
        <span>{payee?.name || "--"}</span>
      )}
    </td>
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
    <td onClick={() => setIsFocused(true)}>
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
    </td>
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
    <td onClick={() => setIsFocused(true)}>
      {isFocused ? (
        <input
          className="input w-full h-auto pl-0"
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
    </td>
  );
};

type TransactionPaymentDepositFieldProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export const TransactionPaymentDepositCell = ({
  value,
  onChange,
}: TransactionPaymentDepositFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [amount, setAmount] = useState(value);

  useEffect(() => {
    setAmount(value);
  }, [value]);

  return (
    <td onClick={() => setIsFocused(true)}>
      {isFocused ? (
        <input
          type="number"
          className="input w-full h-auto pl-0"
          value={amount?.toString()}
          onChange={(e) => {
            setAmount(e.target.valueAsNumber);
          }}
          onBlur={() => {
            onChange(amount || 0);
            setIsFocused(false);
          }}
          autoFocus
        />
      ) : (
        value !== null && <Amount amount={value * 100} />
      )}
    </td>
  );
};
