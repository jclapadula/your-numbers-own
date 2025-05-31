import type { MonthOfYear } from "./models";

export const isValidMonthOfYear = (monthOfYear: MonthOfYear) => {
  return (
    monthOfYear.month >= 1 &&
    monthOfYear.month <= 12 &&
    monthOfYear.year >= 2000 &&
    monthOfYear.year <= 2100
  );
};

export const isBefore = (date1: MonthOfYear, date2: MonthOfYear) => {
  if (date1.year < date2.year) return true;
  if (date1.year > date2.year) return false;
  return date1.month < date2.month;
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
