import Amount from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import type { Category } from "~/api/models";

type CategoryRowProps = {
  category: Category;
  budgeted: number;
  spent: number;
  balance: number;
};

export const CategoryRow = ({
  category,
  budgeted,
  spent,
  balance,
}: CategoryRowProps) => {
  return (
    <div className="flex justify-between border-b border-neutral-content/5 [&>div]:p-2 bg-base-200">
      <CategoryCell className="pl-6 text-sm">{category.name}</CategoryCell>
      <div className="flex max-w-lg w-full">
        <BudgetedCell>
          <Amount amount={budgeted} hideSign />
        </BudgetedCell>
        <SpentCell>
          <Amount amount={spent} hideSign />
        </SpentCell>
        <BalanceCell>
          <Amount amount={balance} hideSign />
        </BalanceCell>
      </div>
    </div>
  );
};
