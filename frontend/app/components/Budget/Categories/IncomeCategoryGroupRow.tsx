import { useState } from "react";
import Amount from "../../Amount";
import { BalanceCell, BudgetedCell, SpentCell } from "../BudgetCells";
import { CategoryCell } from "../BudgetCells";
import { CreateCategoryModal } from "./CreateCategoryModal";
import type { CategoryGroup } from "~/api/models";

type IncomeCategoryGroupRowProps = {
  categoryGroup: CategoryGroup;
  balance: number;
  children: React.ReactNode;
};

export const IncomeCategoryGroupRow = ({
  categoryGroup,
  balance,
  children,
}: IncomeCategoryGroupRowProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <div className="flex justify-between border-b border-neutral-content/10 [&>div]:p-2 bg-base-300">
        <CategoryCell className="flex items-center justify-between group">
          <span className="font-semibold">{categoryGroup.name}</span>
          <div
            className="tooltip group-hover:opacity-100 opacity-0 transition-opacity"
            data-tip="Add category"
          >
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-xs btn-primary btn-soft"
            >
              +
            </button>
          </div>
        </CategoryCell>
        <div className="flex max-w-lg w-full items-center">
          <BudgetedCell>{""}</BudgetedCell>
          <SpentCell>{""}</SpentCell>
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
