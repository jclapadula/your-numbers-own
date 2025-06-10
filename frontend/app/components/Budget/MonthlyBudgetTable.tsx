import Amount from "../Amount";
import { BalanceCell } from "./BudgetCells";
import { BudgetedCell, SpentCell } from "./BudgetCells";
import { CategoryCell } from "./BudgetCells";
import { useMonthlyBudget } from "./MonthlyBudgetQueries";
import { useSelectedMonthContext } from "./SelectedMonthContext";

const TableHeaders = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget } = useMonthlyBudget(selectedMonth);

  const totalBudgeted =
    monthlyBudget?.monthCategories.reduce(
      (acc, category) =>
        category.categoryId ? acc + category.assignedAmount : acc,
      0
    ) || 0;
  const totalBalance =
    monthlyBudget?.monthCategories.reduce(
      (acc, category) => (category.categoryId ? acc + category.balance : acc),
      0
    ) || 0;
  const totalSpent = totalBalance - totalBudgeted;

  return (
    <div className="flex justify-between border-b border-neutral-content/20 [&>div]:p-1">
      <CategoryCell className="text-neutral-content/50 content-center">
        Category
      </CategoryCell>
      <div className="flex max-w-lg w-full">
        <BudgetedCell>
          <div className="flex flex-col font-bold text-neutral-content/50">
            Budgeted
            <Amount amount={totalBudgeted} hideSign />
          </div>
        </BudgetedCell>
        <SpentCell>
          <div className="flex flex-col font-bold text-neutral-content/50">
            Spent
            <Amount amount={totalSpent} hideSign />
          </div>
        </SpentCell>
        <BalanceCell>
          <div className="flex flex-col font-bold text-neutral-content/50">
            Balance
            <Amount amount={totalBalance} hideSign />
          </div>
        </BalanceCell>
      </div>
    </div>
  );
};

export const MonthlyBudgetTable = () => {
  return (
    <div className="text-sm bg-neutral/50 rounded-sm">
      <TableHeaders />
      <div>table rows</div>
    </div>
  );
};
