import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import Amount from "../Amount";
import { useMonthlyBudget } from "./MonthlyBudgetQueries";
import {
  getMonthOfYear,
  isPastMonth,
  useGetZonedDate,
} from "../Common/dateUtils";
import { useSelectedMonthContext } from "./SelectedMonthContext";
import _ from "lodash";
import { MonthlyBudgetTable } from "./MonthlyBudgetTable";

const MonthAndArrows = () => {
  const getZonedDate = useGetZonedDate();
  const { selectedMonth, addMonth, subtractMonth, toCurrentMonth } =
    useSelectedMonthContext();

  const currentMonth = getMonthOfYear(getZonedDate(new Date()));

  const isCurrentMonth = _.isEqual(currentMonth, selectedMonth);
  const isPast = isPastMonth(selectedMonth, currentMonth);
  const isFuture = !isCurrentMonth && !isPast;

  return (
    <div className="grid grid-cols-3 gap-5 items-center">
      <div className="flex gap-2">
        <div className="tooltip tooltip-bottom" data-tip="Previous month">
          <button className="btn btn-md btn-ghost" onClick={subtractMonth}>
            <ChevronLeftIcon className="w-3 h-3" />
          </button>
        </div>
        {isFuture && (
          <div className="tooltip tooltip-bottom" data-tip="To current month">
            <button className="btn btn-md btn-ghost" onClick={toCurrentMonth}>
              <ChevronDoubleLeftIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div className="prose prose-sm min-w-44 text-center">
        <h1 className={twMerge(!isCurrentMonth && "text-base-content/50")}>
          {format(
            getZonedDate(
              new Date(selectedMonth.year, selectedMonth.month - 1, 1)
            ),
            "MMMM"
          )}
        </h1>
      </div>
      <div className="flex gap-2 justify-end">
        {isPast && (
          <div className="tooltip tooltip-bottom" data-tip="To current month">
            <button className="btn btn-md btn-ghost" onClick={toCurrentMonth}>
              <ChevronDoubleRightIcon className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="tooltip tooltip-bottom" data-tip="Next month">
          <button className="btn btn-md btn-ghost" onClick={addMonth}>
            <ChevronRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
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

    const totalAssignedAmount = monthlyBudget.spendCategories.reduce(
      (acc, category) => acc + category.assignedAmount,
      0
    );
    const totalPreviousBalance = monthlyBudget.lastMonthCarryOver;

    const totalIncome = monthlyBudget.incomeCategories.reduce(
      (acc, category) => acc + category.balance,
      0
    );

    return totalPreviousBalance - totalAssignedAmount + totalIncome;
  }, [monthlyBudget]);

  const isOverBudgeted = availableBudget < 0;

  return (
    <div
      className={twMerge(
        "flex flex-col items-center m-3 prose relative",
        isLoadingMonthlyBudget && "animate-pulse"
      )}
    >
      <span className="prose-sm">
        {isOverBudgeted ? "Over budgeted" : "To budget"}
      </span>
      <Amount
        className={twMerge(
          "text-success",
          "text-2xl",
          isOverBudgeted && "text-error"
        )}
        amount={availableBudget}
      />
    </div>
  );
};

export const MonthlyBudget = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget, isLoading } = useMonthlyBudget(selectedMonth);

  if (isLoading) {
    return (
      <div className="h-full max-w-xl w-full m-auto">
        <div className="pt-4">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-xl w-full m-auto">
      <div className="pt-4">
        <MonthAndArrows />
        <AvailableBudget />
      </div>
      {monthlyBudget && <MonthlyBudgetTable monthlyBudget={monthlyBudget} />}
    </div>
  );
};
