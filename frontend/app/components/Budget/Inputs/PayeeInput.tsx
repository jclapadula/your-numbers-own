import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useCreatePayee, usePayees } from "../budgetQueries";

type PayeeInputProps = {
  value: string | null;
  onPayeeSelected: (payeeId: string | null) => void;
  onBlur: () => void;
  className?: string;
};

export const PayeeInput = ({
  value,
  onPayeeSelected,
  onBlur,
  className,
}: PayeeInputProps) => {
  const { data: payees = [] } = usePayees();
  const { mutateAsync: createPayee } = useCreatePayee();
  const [searchTerm, setSearchTerm] = useState(value || "");

  const filteredPayees = payees.filter((payee) =>
    payee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePayee = async () => {
    if (!searchTerm.trim()) {
      onPayeeSelected(null);
      return;
    }

    const existingPayee = payees.find((p) => p.name === searchTerm);
    if (existingPayee) {
      onPayeeSelected(existingPayee.id);
      return;
    }

    const newPayee = await createPayee(searchTerm);

    onPayeeSelected(newPayee.id);
  };

  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        divRef.current !== event.target &&
        !divRef.current?.contains(event.target as Node)
      ) {
        onBlur();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  return (
    <div className={twMerge("dropdown", className)} ref={divRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        placeholder="Search payees..."
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
          "dropdown-content menu p-0 shadow bg-base-300 rounded overflow-hidden mt-1 w-max max-w-xs min-w-full"
        )}
      >
        {filteredPayees.map((payee) => (
          <li key={payee.id}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPayeeSelected(payee.id);
              }}
            >
              {payee.name}
            </button>
          </li>
        ))}
        {searchTerm.trim() &&
          !filteredPayees.some(
            (p) => p.name.toLowerCase() === searchTerm.toLowerCase()
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
