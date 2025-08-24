import { forwardRef, useState } from "react";
import Amount from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import type { Category } from "~/api/models";
import { Menu, MenuItem } from "~/components/Common/Menu";
import { RenameCategoryModal } from "./RenameCategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type IncomeCategoryRowProps = {
  category: Category;
  balance: number;
};

export const IncomeCategoryRow = ({
  category,
  balance,
}: IncomeCategoryRowProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        <span className="text-[13px] cursor-grab">{category.name}</span>
        <Menu className="group-focus-within:opacity-100 group-hover:opacity-100 opacity-0 transition-opacity">
          <MenuItem onClick={() => setShowEditModal(true)}>Rename</MenuItem>
          <MenuItem onClick={() => setShowDeleteModal(true)}>Delete</MenuItem>
        </Menu>
      </CategoryCell>
      <div className="flex max-w-lg w-full items-center">
        <BudgetedCell>{""}</BudgetedCell>
        <SpentCell>{""}</SpentCell>
        <BalanceCell>
          <Amount amount={balance} hideSign />
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

type IncomeCategoryRowOverlayProps = {
  category: Category;
  balance: number;
};

export const IncomeCategoryRowOverlay = forwardRef<
  HTMLDivElement,
  IncomeCategoryRowOverlayProps
>(({ category, balance }, ref) => {
  return (
    <div className="relative z-50 cursor-grabbing" ref={ref}>
      <div className="flex justify-between border-b border-neutral-content/5 [&>div]:p-2 bg-base-200">
        <CategoryCell className="pl-6 text-sm group flex justify-between items-center">
          <span className="text-[13px]">{category.name}</span>
        </CategoryCell>
        <div className="flex max-w-lg w-full items-center">
          <BudgetedCell>{""}</BudgetedCell>
          <SpentCell>{""}</SpentCell>
          <BalanceCell>
            <Amount amount={balance} hideSign />
          </BalanceCell>
        </div>
      </div>
    </div>
  );
});
