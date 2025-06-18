import { useState } from "react";
import Amount from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import { CreateCategoryModal } from "./CreateCategoryModal";
import type { CategoryGroup } from "~/api/models";

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

  return (
    <>
      <div className="flex justify-between border-b border-neutral-content/10 [&>div]:p-2 bg-base-300">
        <CategoryCell className="flex items-center justify-between font-semibold">
          <span>{categoryGroup.name}</span>
          <div className="tooltip" data-tip="Add category">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-xs btn-primary btn-soft"
            >
              +
            </button>
          </div>
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
      {children}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          categoryGroupId={categoryGroup.id}
        />
      )}
    </>
  );
};
