import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { addMonths, format, isSameMonth, subMonths } from "date-fns";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import Amount from "../Amount";
import { useMonthlyBudget } from "../MonthlyBudget/MonthlyBudgetQueries";
import { getMonthOfYear, useGetZonedDate } from "../Common/dateUtils";
import { useSelectedMonthContext } from "./SelectedMonthContext";
import _ from "lodash";

const MonthAndArrows = () => {
  const getZonedDate = useGetZonedDate();
  const { selectedMonth, addMonth, subtractMonth } = useSelectedMonthContext();

  const isCurrentMonth = _.isEqual(
    getMonthOfYear(getZonedDate(new Date())),
    selectedMonth
  );

  return (
    <div className="flex justify-between gap-5 items-center">
      <button className="btn btn-md btn-ghost" onClick={subtractMonth}>
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      <div className="prose prose-md min-w-44 text-center">
        <h1 className={twMerge(!isCurrentMonth && "text-base-content/50")}>
          {format(
            getZonedDate(
              new Date(selectedMonth.year, selectedMonth.month - 1, 1)
            ),
            "MMMM"
          )}
        </h1>
      </div>
      <button className="btn btn-md btn-ghost" onClick={addMonth}>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const AvailableBudget = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget, isLoading: isLoadingMonthlyBudget } =
    useMonthlyBudget(selectedMonth);

  const availableBudget = useMemo(() => {
    if (!monthlyBudget) {
      return 0;
    }

    const totalAssignedAmount = monthlyBudget.monthCategories.reduce(
      (acc, category) => acc + category.assignedAmount,
      0
    );
    const totalBalance = monthlyBudget?.monthCategories.reduce(
      (acc, category) => acc + category.balance,
      0
    );

    return totalBalance - totalAssignedAmount;
  }, [monthlyBudget]);

  const isOverSpent = availableBudget < 0;

  return (
    <div className="flex flex-col items-center m-3 prose relative">
      {isLoadingMonthlyBudget && (
        <div className="top-0 skeleton w-full h-full absolute"></div>
      )}
      <span className="prose-sm">
        {isOverSpent ? "Over spent" : "Available"}
      </span>
      <Amount
        className={twMerge(
          "text-success",
          "text-2xl",
          isOverSpent && "text-error"
        )}
        amount={availableBudget}
      />
    </div>
  );
};

export const MonthlyBudgetTable = () => {
  return (
    <div className="h-full max-w-lg w-full">
      <div className="pt-4">
        <MonthAndArrows />
        <AvailableBudget />
      </div>
      <div>
        <div>table headers</div>
        <div>table rows</div>
      </div>
    </div>
  );
};
