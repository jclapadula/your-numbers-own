import { createContext, useContext, useState } from "react";

const CurrentBudgetContext = createContext<{
  budgetId: string;
  timezone: string;
  setBudgetId: (budgetId: string) => void;
  setTimezone: (timezone: string) => void;
}>({
  budgetId: "",
  timezone: "",
  setBudgetId: () => {},
  setTimezone: () => {},
});

export const useCurrentBudgetContext = () => {
  return useContext(CurrentBudgetContext);
};

export const CurrentBudgetContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [budgetId, setBudgetId] = useState("");
  const [timezone, setTimezone] = useState("");

  return (
    <CurrentBudgetContext.Provider
      value={{ budgetId, setBudgetId, timezone, setTimezone }}
    >
      {children}
    </CurrentBudgetContext.Provider>
  );
};
