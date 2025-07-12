import { useState, useEffect } from "react";
import { Modal } from "../../Common/Modal";
import { useDeleteCategoryGroup } from "./CategoryGroupsQueries";
import { useCategories } from "../Categories/CategoriesQueries";
import { useCategoryGroups } from "./CategoryGroupsQueries";
import type { CategoryGroup } from "~/api/models";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export const DeleteCategoryGroupModal = ({
  onClose,
  categoryGroup,
}: {
  onClose: () => void;
  categoryGroup: CategoryGroup;
}) => {
  const [selectedCategoryGroupId, setSelectedCategoryGroupId] =
    useState<string>("");
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: deleteCategoryGroup, isPending } =
    useDeleteCategoryGroup();
  const { data: categories = [] } = useCategories();
  const { data: categoryGroups = [] } = useCategoryGroups();

  const groupCategories = categories.filter(
    (category) => category.groupId === categoryGroup.id
  );

  const availableCategoryGroups = categoryGroups.filter(
    (group) => group.id !== categoryGroup.id && !group.isIncome
  );

  const hasCategories = groupCategories.length > 0;

  const handleDelete = async () => {
    if (hasCategories && !selectedCategoryGroupId) {
      setIsValid(false);
      return;
    }

    await deleteCategoryGroup({
      id: categoryGroup.id,
      moveToGroupId: selectedCategoryGroupId || "",
    });

    onClose();
  };

  // If the category group cannot be deleted (no other groups available and has categories)
  if (hasCategories && availableCategoryGroups.length === 0) {
    return (
      <Modal
        onClose={onClose}
        title="Cannot Delete Category Group"
        onSave={onClose}
        disabled={isPending}
      >
        <div className="space-y-4">
          <div className="alert alert-warning">
            <ExclamationTriangleIcon className="stroke-current shrink-0 h-6 w-6" />
            <span>
              This category group cannot be deleted because it contains
              categories and there are no other category groups available to
              move them to.
            </span>
          </div>
          <p className="text-sm text-base-content/70">
            Create another category group first, then try deleting this one.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      title="Delete Category Group"
      onSave={handleDelete}
      disabled={isPending}
    >
      <form>
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{" "}
            <strong>"{categoryGroup.name}"</strong>?
          </p>

          {hasCategories && (
            <>
              <div className="alert alert-warning">
                <ExclamationTriangleIcon className="stroke-current shrink-0 h-6 w-6" />
                <span>
                  This category group contains {groupCategories.length} categor
                  {groupCategories.length === 1 ? "y" : "ies"} that will be
                  moved to another group.
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Categories to be moved:
                </div>
                <ul className="text-sm text-base-content/70 list-disc list-inside">
                  {groupCategories.map((category) => (
                    <li key={category.id}>{category.name}</li>
                  ))}
                </ul>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Move categories to</legend>
                <select
                  className="select select-bordered w-full"
                  value={selectedCategoryGroupId}
                  onChange={(e) => setSelectedCategoryGroupId(e.target.value)}
                >
                  <option value="">Select a category group</option>
                  {availableCategoryGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {!isValid && (
                  <div className="text-error">
                    Please select a category group
                  </div>
                )}
              </fieldset>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};
