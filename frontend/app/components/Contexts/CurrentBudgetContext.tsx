import { createContext, useContext, useState } from "react";

const CurrentBudgetContext = createContext<{
  budgetId: string;
  setBudgetId: (budgetId: string) => void;
}>({
  budgetId: "",
  setBudgetId: () => {},
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

  return (
    <CurrentBudgetContext.Provider value={{ budgetId, setBudgetId }}>
      {children}
    </CurrentBudgetContext.Provider>
  );
};
