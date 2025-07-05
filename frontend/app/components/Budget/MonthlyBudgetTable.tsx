import { useState } from "react";
import { groupBy, mapValues, sumBy } from "lodash";
import Amount from "../Amount";
import { BalanceCell } from "./BudgetCells";
import { BudgetedCell, SpentCell } from "./BudgetCells";
import { CategoryCell } from "./BudgetCells";
import { CategoryGroupRow } from "./Categories/CategoryGroupRow";
import { CategoryRow } from "./Categories/CategoryRow";
import { CreateCategoryGroupModal } from "./Categories/CreateCategoryGroupModal";
import { useCategories } from "./Categories/CategoriesQueries";
import { useCategoryGroups } from "./Categories/CategoryGroupsQueries";
import { useMonthlyBudget } from "./MonthlyBudgetQueries";
import { useSelectedMonthContext } from "./SelectedMonthContext";
import type { Category, CategoryGroup } from "~/api/models";
import _ from "lodash";

const TableHeaders = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget } = useMonthlyBudget(selectedMonth);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalAssigned =
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
  const totalSpent =
    monthlyBudget?.monthCategories.reduce(
      (acc, category) => (category.categoryId ? acc + category.spent : acc),
      0
    ) || 0;

  return (
    <>
      <div className="flex justify-between border-b border-neutral-content/20 [&>div]:p-2">
        <CategoryCell className="text-neutral-content/50 content-center flex items-center justify-between group">
          <span>Category</span>
          <div
            className="tooltip group-hover:opacity-100 opacity-0 transition-opacity"
            data-tip="Add category group"
          >
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
            <div className="flex flex-col font-bold text-neutral-content/50">
              Budgeted
              <Amount amount={totalAssigned} hideSign />
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
      {showCreateModal && (
        <CreateCategoryGroupModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
};

export const MonthlyBudgetTable = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget } = useMonthlyBudget(selectedMonth);
  const { data: categoryGroups = [] } = useCategoryGroups();
  const { data: categories = [] } = useCategories();

  const budgetDataByCategoryId = _.keyBy(
    monthlyBudget?.monthCategories,
    "categoryId"
  );

  const categoriesByGroup = groupBy(categories, "groupId");

  const groupTotals = mapValues(categoriesByGroup, (groupCategories) => ({
    assignedAmount: sumBy(
      groupCategories,
      (category) => budgetDataByCategoryId[category.id]?.assignedAmount || 0
    ),
    spent: sumBy(
      groupCategories,
      (category) => budgetDataByCategoryId[category.id]?.spent || 0
    ),
    balance: sumBy(
      groupCategories,
      (category) => budgetDataByCategoryId[category.id]?.balance || 0
    ),
  }));

  return (
    <div className="text-sm bg-neutral/50 rounded-sm">
      <TableHeaders />
      <div>
        {categoryGroups.map((categoryGroup: CategoryGroup) => {
          const groupCategories = categoriesByGroup[categoryGroup.id] || [];
          const groupTotalsData = groupTotals[categoryGroup.id] || {
            assignedAmount: 0,
            spent: 0,
            balance: 0,
          };

          return (
            <CategoryGroupRow
              key={categoryGroup.id}
              categoryGroup={categoryGroup}
              budgeted={groupTotalsData.assignedAmount}
              spent={groupTotalsData.spent}
              balance={groupTotalsData.balance}
            >
              {groupCategories.map((category: Category) => {
                const budgetData = budgetDataByCategoryId[category.id] || {
                  budgeted: 0,
                  spent: 0,
                  balance: 0,
                };

                return (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    budgeted={budgetData.assignedAmount}
                    spent={budgetData.spent}
                    balance={budgetData.balance}
                  />
                );
              })}
            </CategoryGroupRow>
          );
        })}
      </div>
    </div>
  );
};
