import { useState } from "react";
import Amount, { rawNumberToAmount } from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import type { Category } from "~/api/models";
import { Menu, MenuItem } from "~/components/Common/Menu";
import { RenameCategoryModal } from "./RenameCategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import { CategoryAssignedBudgetInput } from "./CategoryAssignedBudgetInput";
import { useUpdateMonthlyBudget } from "../MonthlyBudgetQueries";
import { useSelectedMonthContext } from "../SelectedMonthContext";
import { twMerge } from "tailwind-merge";

type CategoryRowProps = {
  category: Category;
  budgeted: number;
  spent: number;
  balance: number;
};

const focusNextElement = (currentElement: HTMLElement) => {
  var divsWithTabIndex = "div[tabindex]:not([tabindex='-1'])";
  if (currentElement) {
    var focusable = Array.prototype.filter.call(
      document.querySelectorAll(divsWithTabIndex),
      function (element) {
        //check for visibility while always include the current activeElement
        return (
          element.offsetWidth > 0 ||
          element.offsetHeight > 0 ||
          element === currentElement
        );
      }
    );
    var index = focusable.indexOf(currentElement);
    if (index > -1) {
      var nextElement = focusable[index + 1] || focusable[0];
      nextElement.focus();
    }
  }
};

export const CategoryRow = ({
  category,
  budgeted,
  spent,
  balance,
}: CategoryRowProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { selectedMonth } = useSelectedMonthContext();

  const { mutateAsync: updateMonthlyBudget } = useUpdateMonthlyBudget();

  return (
    <div className="flex justify-between border-b border-neutral-content/5 [&>div]:p-2 bg-base-200">
      <CategoryCell className="pl-6 text-sm group flex justify-between items-center">
        <span className="text-[13px]">{category.name}</span>
        <Menu className="group-focus-within:opacity-100 group-hover:opacity-100 opacity-0 transition-opacity">
          <MenuItem onClick={() => setShowEditModal(true)}>Rename</MenuItem>
          <MenuItem onClick={() => setShowDeleteModal(true)}>Delete</MenuItem>
        </Menu>
      </CategoryCell>
      <div className="flex max-w-lg w-full items-center">
        <BudgetedCell>
          <CategoryAssignedBudgetInput
            focusable
            rawValue={budgeted}
            onChange={(newValue) => {
              updateMonthlyBudget({
                assignedAmount: rawNumberToAmount(newValue),
                categoryId: category.id,
                monthOfYear: selectedMonth,
              });
            }}
            onNext={focusNextElement}
          />
        </BudgetedCell>
        <SpentCell>
          <Amount amount={spent} hideSign />
        </SpentCell>
        <BalanceCell>
          <Amount
            amount={balance}
            hideSign
            className={twMerge(balance < 0 && "text-error")}
          />
        </BalanceCell>
      </div>
      {showEditModal && (
        <RenameCategoryModal
          category={category}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showDeleteModal && (
        <DeleteCategoryModal
          category={category}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
