import { forwardRef, useState } from "react";
import Amount, { rawNumberToAmount } from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import type { Category } from "~/api/models";
import { Menu, MenuItem } from "~/components/Common/Menu";
import { RenameCategoryModal } from "./RenameCategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import {
  CategoryAssignedBudgetInput,
  CategoryAssignedBudgetInputDataType,
} from "./CategoryAssignedBudgetInput";
import { useUpdateMonthlyBudget } from "../MonthlyBudgetQueries";
import { useSelectedMonthContext } from "../SelectedMonthContext";
import { twMerge } from "tailwind-merge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CategoryRowProps = {
  category: Category;
  budgeted: number;
  spent: number;
  balance: number;
};

const focusNextElement = (currentElement: HTMLElement, dir: "up" | "down") => {
  if (!currentElement) {
    return;
  }

  var divsWithTabIndex = `div[data-type="${CategoryAssignedBudgetInputDataType}"]`;

  var focusableDivs = (
    [...document.querySelectorAll(divsWithTabIndex)] as HTMLElement[]
  ).filter((element) => {
    return (
      element.offsetWidth > 0 ||
      element.offsetHeight > 0 ||
      element === currentElement
    );
  });

  var index = focusableDivs.indexOf(currentElement);
  if (index < 0) {
    return;
  }

  const nextIndex = dir === "up" ? index - 1 : index + 1;
  var nextElement = focusableDivs.at(nextIndex);
  nextElement && nextElement?.focus();
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: "category",
      category,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      className="flex justify-between border-b border-neutral-content/5 [&>div]:p-2 bg-base-200"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
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
            onJumpFocus={focusNextElement}
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
          onClose={() => {
            setShowEditModal(false);
          }}
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

type CategoryRowOverlayProps = {
  category: Category;
  budgeted: number;
  spent: number;
  balance: number;
};

export const CategoryRowOverlay = forwardRef<
  HTMLDivElement,
  CategoryRowOverlayProps
>(({ category, budgeted, spent, balance }, ref) => {
  return (
    <div className="relative z-50 cursor-grabbing" ref={ref}>
      <div className="flex justify-between border-b border-neutral-content/5 [&>div]:p-2 bg-base-200">
        <CategoryCell className="pl-6 text-sm group flex justify-between items-center">
          <span className="text-[13px]">{category.name}</span>
        </CategoryCell>
        <div className="flex max-w-lg w-full items-center">
          <BudgetedCell>
            <Amount amount={budgeted} hideSign />
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
      </div>
    </div>
  );
});
