import type { MonthOfYear } from "~/api/models";
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

export const getNextMonthOfYear = ({ month, year }: MonthOfYear) => {
  if (month === 12) {
    month = 1;
    year++;
  } else {
    month++;
  }

  return {
    year,
    month,
  };
};

export const getPreviousMonthOfYear = ({ month, year }: MonthOfYear) => {
  if (month === 1) {
    month = 12;
    year--;
  } else {
    month--;
  }

  return {
    year,
    month,
  };
};

export const isPastMonth = (
  pastMonth: MonthOfYear,
  compareToMonth: MonthOfYear
) => {
  return (
    pastMonth.year < compareToMonth.year ||
    (pastMonth.year === compareToMonth.year &&
      pastMonth.month < compareToMonth.month)
  );
};
