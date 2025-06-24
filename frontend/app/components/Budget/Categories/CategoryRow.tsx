import { useState } from "react";
import Amount from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import type { Category } from "~/api/models";
import { Menu, MenuItem } from "~/components/Common/Menu";
import { EditCategoryModal } from "./EditCategoryModal";

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
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="flex justify-between border-b border-neutral-content/5 [&>div]:p-2 bg-base-200">
      <CategoryCell className="pl-6 text-sm group flex justify-between items-center">
        <span className="text-[13px]">{category.name}</span>
        <Menu className="group-focus-within:opacity-100 group-hover:opacity-100 opacity-0 transition-opacity">
          <MenuItem onClick={() => setShowEditModal(true)}>Edit</MenuItem>
          {showEditModal && (
            <EditCategoryModal
              category={category}
              onClose={() => setShowEditModal(false)}
            />
          )}
        </Menu>
      </CategoryCell>
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
