import { useState } from "react";
import { groupBy, mapValues, sumBy } from "lodash";
import Amount from "../Amount";
import { BalanceCell } from "./BudgetCells";
import { BudgetedCell, SpentCell } from "./BudgetCells";
import { CategoryCell } from "./BudgetCells";
import {
  CategoryGroupRow,
  CategoryGroupRowOverlay,
} from "./CategoryGroups/CategoryGroupRow";
import { CategoryRow } from "./Categories/CategoryRow";
import { CreateCategoryGroupModal } from "./CategoryGroups/CreateCategoryGroupModal";
import { useCategories } from "./Categories/CategoriesQueries";
import {
  useCategoryGroups,
  useMoveCategoryGroup,
  useUpdateCategoryGroup,
} from "./CategoryGroups/CategoryGroupsQueries";
import { useMonthlyBudget } from "./MonthlyBudgetQueries";
import { useSelectedMonthContext } from "./SelectedMonthContext";
import type { Category, CategoryGroup, MonthlyBudget } from "~/api/models";
import _ from "lodash";
import { IncomeCategoryGroupRow } from "./CategoryGroups/IncomeCategoryGroupRow";
import { IncomeCategoryRow } from "./Categories/IncomeCategoryRow";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { twMerge } from "tailwind-merge";

const TableHeaders = () => {
  const { selectedMonth } = useSelectedMonthContext();
  const { data: monthlyBudget } = useMonthlyBudget(selectedMonth);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalAssigned =
    monthlyBudget?.spendCategories.reduce(
      (acc, category) =>
        category.categoryId ? acc + category.assignedAmount : acc,
      0
    ) || 0;
  const totalBalance =
    monthlyBudget?.spendCategories.reduce(
      (acc, category) => (category.categoryId ? acc + category.balance : acc),
      0
    ) || 0;
  const totalSpent =
    monthlyBudget?.spendCategories.reduce(
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

const useMonthlyBudgetData = (monthlyBudget: MonthlyBudget) => {
  const { data: categoryGroups = [] } = useCategoryGroups();
  const { data: categories = [] } = useCategories();

  const spendCategoriesById = _.keyBy(
    monthlyBudget?.spendCategories,
    "categoryId"
  );
  const incomeCategoriesById = _.keyBy(
    monthlyBudget?.incomeCategories,
    "categoryId"
  );

  const categoriesByGroup = groupBy(categories, "groupId");

  const groupTotals = mapValues(categoriesByGroup, (groupCategories) => ({
    assignedAmount: sumBy(
      groupCategories,
      (category) => spendCategoriesById[category.id]?.assignedAmount || 0
    ),
    spent: sumBy(
      groupCategories,
      (category) => spendCategoriesById[category.id]?.spent || 0
    ),
    balance: sumBy(
      groupCategories,
      (category) =>
        spendCategoriesById[category.id]?.balance ||
        incomeCategoriesById[category.id]?.balance ||
        0
    ),
  }));

  const spendCategoryGroups = categoryGroups.filter(
    (categoryGroup) => !categoryGroup.isIncome
  );
  const incomeCategoryGroups = categoryGroups.filter(
    (categoryGroup) => categoryGroup.isIncome
  );

  return {
    spendCategoryGroups,
    incomeCategoryGroups,
    groupTotals,
    categoriesByGroup,
    spendCategoriesById,
    incomeCategoriesById,
  };
};

export const MonthlyBudgetTable = ({
  monthlyBudget,
}: {
  monthlyBudget: MonthlyBudget;
}) => {
  const {
    spendCategoryGroups,
    incomeCategoryGroups,
    groupTotals,
    categoriesByGroup,
    spendCategoriesById,
    incomeCategoriesById,
  } = useMonthlyBudgetData(monthlyBudget);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { mutateAsync: moveCategoryGroup, isPending: isMovingCategoryGroup } =
    useMoveCategoryGroup();

  const [draggingCategoryGroup, setDraggingCategoryGroup] =
    useState<CategoryGroup | null>(null);

  const handleDragEnd = async (e: DragEndEvent) => {
    console.log(e);
    if (!e.over?.data.current?.sortable) {
      setDraggingCategoryGroup(null);
      return;
    }

    const { containerId, index } = e.over.data.current.sortable;
    if (containerId === "spend-category-groups") {
      await moveCategoryGroup({
        id: e.active.id as string,
        newPosition: index,
      });
      setDraggingCategoryGroup(null);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    console.log(e);
    const categoryGroup = spendCategoryGroups.find(
      (group) => group.id === e.active.id
    );
    if (categoryGroup) {
      setDraggingCategoryGroup(categoryGroup);
    }
  };

  return (
    <div
      className={twMerge(
        "text-sm bg-neutral/50 rounded-sm",
        isMovingCategoryGroup && "animate-pulse"
      )}
    >
      <TableHeaders />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div>
          <SortableContext
            items={spendCategoryGroups}
            id="spend-category-groups"
          >
            {spendCategoryGroups.map((categoryGroup: CategoryGroup) => {
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
                    const budgetData = spendCategoriesById[category.id] || {
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
            <DragOverlay>
              {(() => {
                if (!draggingCategoryGroup) {
                  return null;
                }

                const groupTotalsData = groupTotals[
                  draggingCategoryGroup.id
                ] || {
                  assignedAmount: 0,
                  spent: 0,
                  balance: 0,
                };

                return (
                  <CategoryGroupRowOverlay
                    categoryGroup={draggingCategoryGroup}
                    budgeted={groupTotalsData.assignedAmount}
                    spent={groupTotalsData.spent}
                    balance={groupTotalsData.balance}
                  />
                );
              })()}
            </DragOverlay>
          </SortableContext>

          <div className="divider -mt-2 mb-0" />
          <div className="divider -mb-2 mt-0" />
          {incomeCategoryGroups.map((categoryGroup: CategoryGroup) => {
            const groupCategories = categoriesByGroup[categoryGroup.id] || [];
            const groupTotalsData = groupTotals[categoryGroup.id] || {
              balance: 0,
            };

            return (
              <IncomeCategoryGroupRow
                key={categoryGroup.id}
                categoryGroup={categoryGroup}
                balance={groupTotalsData.balance}
              >
                {groupCategories.map((category: Category) => {
                  const budgetData = incomeCategoriesById[category.id] || {
                    balance: 0,
                  };

                  return (
                    <IncomeCategoryRow
                      key={category.id}
                      category={category}
                      balance={budgetData.balance}
                    />
                  );
                })}
              </IncomeCategoryGroupRow>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
