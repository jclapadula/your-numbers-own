import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { getMonthOfYear, useGetZonedDate } from "../Common/dateUtils";
import type { MonthOfYear } from "../../api/models";

type SelectedMonthContextType = {
  selectedMonth: MonthOfYear;
  addMonth: () => void;
  subtractMonth: () => void;
};

const SelectedMonthContext = createContext<
  SelectedMonthContextType | undefined
>(undefined);

export const useSelectedMonthContext = () => {
  const context = useContext(SelectedMonthContext);
  if (!context) {
    throw new Error(
      "useSelectedMonthContext must be used within a SelectedMonthContextProvider"
    );
  }
  return context;
};

export const SelectedMonthContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const getZonedDate = useGetZonedDate();

  const [selectedMonth, setSelectedMonth] = useState<MonthOfYear>(() => {
    const storedMonth = localStorage.getItem("lastSelectedMonth");
    if (storedMonth) {
      return getMonthOfYear(getZonedDate(new Date(storedMonth)));
    }
    return getMonthOfYear(getZonedDate(new Date()));
  });

  const updateSelectedMonth = (date: Date) => {
    setSelectedMonth(getMonthOfYear(date));
    localStorage.setItem("lastSelectedMonth", date.toISOString());
  };

  const addMonth = () => {
    const date = getZonedDate(
      new Date(selectedMonth.year, selectedMonth.month, 10)
    );
    updateSelectedMonth(date);
  };

  const subtractMonth = () => {
    const date = getZonedDate(
      new Date(selectedMonth.year, selectedMonth.month - 2, 10)
    );
    updateSelectedMonth(date);
  };

  return (
    <SelectedMonthContext.Provider
      value={{ selectedMonth, addMonth, subtractMonth }}
    >
      {children}
    </SelectedMonthContext.Provider>
  );
};
