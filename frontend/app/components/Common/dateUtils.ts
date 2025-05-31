import { useCurrentBudgetContext } from "../Contexts/CurrentBudgetContext";
import { toZonedTime } from "date-fns-tz";

export const useGetZonedDate = () => {
  const { timezone } = useCurrentBudgetContext();

  return (date: Date) => {
    return toZonedTime(date, timezone);
  };
};

export const getMonthOfYear = (date: Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
};
