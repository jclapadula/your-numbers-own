import { forwardRef, useState } from "react";
import Amount from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import { CreateCategoryModal } from "../Categories/CreateCategoryModal";
import type { CategoryGroup } from "~/api/models";
import { Menu, MenuItem } from "~/components/Common/Menu";
import { EditCategoryGroupModal } from "./EditCategoryGroupModal";
import { DeleteCategoryGroupModal } from "./DeleteCategoryGroupModal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CategoryGroupRowProps = {
  categoryGroup: CategoryGroup;
  budgeted: number;
  spent: number;
  balance: number;
  children: React.ReactNode;
};

export const CategoryGroupRow = ({
  categoryGroup,
  budgeted,
  spent,
  balance,
  children,
}: CategoryGroupRowProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: categoryGroup.id,
    data: {
      type: 'categoryGroup',
      categoryGroup,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      className="relative"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between border-b border-neutral-content/10 [&>div]:p-2 bg-base-300">
        <CategoryCell className="flex items-center justify-between group">
          <span className="font-semibold">{categoryGroup.name}</span>
          <Menu className="group-focus-within:opacity-100 group-hover:opacity-100 opacity-0 transition-opacity">
            <MenuItem onClick={() => setShowCreateModal(true)}>
              Add category
            </MenuItem>
            <MenuItem onClick={() => setShowRenameModal(true)}>Rename</MenuItem>
            <MenuItem onClick={() => setShowDeleteModal(true)}>Delete</MenuItem>
          </Menu>
        </CategoryCell>
        <div className="flex max-w-lg w-full items-center">
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
      {children}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          categoryGroupId={categoryGroup.id}
        />
      )}
      {showRenameModal && (
        <EditCategoryGroupModal
          onClose={() => setShowRenameModal(false)}
          categoryGroup={categoryGroup}
        />
      )}
      {showDeleteModal && (
        <DeleteCategoryGroupModal
          onClose={() => setShowDeleteModal(false)}
          categoryGroup={categoryGroup}
        />
      )}
    </div>
  );
};

type CategoryGroupRowOverlayProps = {
  categoryGroup: CategoryGroup;
  budgeted: number;
  spent: number;
  balance: number;
};

export const CategoryGroupRowOverlay = forwardRef<
  HTMLDivElement,
  CategoryGroupRowOverlayProps
>(({ categoryGroup, budgeted, spent, balance }, ref) => {
  return (
    <div className="relative z-50" ref={ref}>
      <div className="flex justify-between border-b border-neutral-content/10 [&>div]:p-2 bg-base-300">
        <CategoryCell className="flex items-center justify-between group">
          <span className="font-semibold">{categoryGroup.name}</span>
        </CategoryCell>
        <div className="flex max-w-lg w-full items-center">
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
    </div>
  );
});
