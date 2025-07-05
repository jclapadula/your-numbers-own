import type { MonthOfYear } from "./models";

export const parseMonthOfYear = (monthOfYear: MonthOfYear) => {
  return {
    year: parseInt(monthOfYear.year as unknown as string),
    month: parseInt(monthOfYear.month as unknown as string),
  };
};
