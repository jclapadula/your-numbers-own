import type { MonthOfYear } from "./models";

export const isValidMonthOfYear = (monthOfYear: MonthOfYear) => {
  return (
    monthOfYear.month >= 1 &&
    monthOfYear.month <= 12 &&
    monthOfYear.year >= 2000 &&
    monthOfYear.year <= 2100
  );
};

export const getMonthOfYear = (date: Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
};
