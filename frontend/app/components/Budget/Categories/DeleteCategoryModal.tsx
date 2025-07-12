import { useState } from "react";
import { Modal } from "../../Common/Modal";
import { useDeleteCategory } from "./CategoriesQueries";
import { useCategories } from "./CategoriesQueries";
import type { Category } from "~/api/models";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CategorySelect } from "../Inputs/CategorySelect";

export const DeleteCategoryModal = ({
  onClose,
  category,
}: {
  onClose: () => void;
  category: Category;
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: deleteCategory, isPending } = useDeleteCategory();
  const { data: categories = [] } = useCategories();

  // Filter out the current category from available options
  const availableCategories = categories.filter(
    (cat) => cat.id !== category.id
  );

  const handleDelete = async () => {
    if (!selectedCategoryId) {
      setIsValid(false);
      return;
    }

    await deleteCategory({
      id: category.id,
      moveTransactionsToCategoryId: selectedCategoryId,
    });
    onClose();
  };

  // If no other categories are available
  if (availableCategories.length === 0) {
    return (
      <Modal
        onClose={onClose}
        title="Cannot Delete Category"
        onSave={onClose}
        disabled={isPending}
      >
        <div className="space-y-4">
          <div className="alert alert-warning">
            <ExclamationTriangleIcon className="stroke-current shrink-0 h-6 w-6" />
            <span>
              This category cannot be deleted because there are no other
              categories available to move transactions to.
            </span>
          </div>
          <p className="text-sm text-base-content/70">
            Create another category first, then try deleting this one.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      title="Delete Category"
      onSave={handleDelete}
      disabled={isPending}
    >
      <div className="space-y-4">
        <p>
          Are you sure you want to delete <strong>"{category.name}"</strong>?
        </p>

        <div className="alert alert-warning mt-4">
          <ExclamationTriangleIcon className="stroke-current shrink-0 h-6 w-6" />
          <span>
            Select a category where to move all transactions assigned to this
            category.
          </span>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Move transactions to</legend>
          <div className="relative">
            <CategorySelect
              value={
                selectedCategoryId
                  ? categories.find((c) => c.id === selectedCategoryId)?.name ||
                    ""
                  : ""
              }
              onCategorySelected={(categoryId) => {
                setSelectedCategoryId(categoryId);
                setIsValid(true);
              }}
              variant="full"
              categoryFilter={(c) =>
                c.id !== category.id && c.isIncome === category.isIncome
              }
            />
            {!isValid && (
              <div className="text-error mt-2">Please select a category</div>
            )}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
};
