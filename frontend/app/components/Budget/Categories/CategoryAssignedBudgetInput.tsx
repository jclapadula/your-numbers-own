import { useEffect, useState } from "react";
import Amount, { rawValueToString } from "~/components/Amount";

type CategoryAssignedBudgetInputProps = {
  rawValue: number | null;
  onChange: (value: number) => void;
};

export const CategoryAssignedBudgetInput = ({
  rawValue,
  onChange,
}: CategoryAssignedBudgetInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const initialValue = rawValueToString(rawValue || 0);
  const [amount, setAmount] = useState(initialValue);

  useEffect(() => {
    setAmount(initialValue);
  }, [initialValue]);

  return (
    <div
      onClick={() => setIsFocused(true)}
      onFocus={() => setIsFocused(true)}
      className="w-full h-full p-0 m-0"
    >
      {isFocused ? (
        <input
          className="input w-full h-auto pr-0 !outline-0 text-right"
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
        rawValue !== null && <Amount amount={rawValue} hideSign />
      )}
    </div>
  );
};
