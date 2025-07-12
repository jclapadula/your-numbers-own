import { useState, useEffect } from "react";
import { Modal } from "../../Common/Modal";
import { useUpdateCategory } from "./CategoriesQueries";
import type { Category } from "~/api/models";

export const RenameCategoryModal = ({
  onClose,
  category,
}: {
  onClose: () => void;
  category: Category;
}) => {
  const [name, setName] = useState(category.name);
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: updateCategory, isPending } = useUpdateCategory();

  // Update the name when the category prop changes
  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name.trim()) {
      setIsValid(false);
      return;
    }

    // Only update if the name has actually changed
    if (name.trim() !== category.name) {
      await updateCategory({ id: category.id, name: name.trim() });
    }
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Edit Category"
      onSave={handleSave}
      disabled={isPending}
    >
      <form onSubmit={handleSave}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Category name</legend>
          <input
            type="text"
            className="input"
            placeholder="Like Groceries or Gas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {!isValid && <div className="text-error">Enter a category name</div>}
        </fieldset>
      </form>
    </Modal>
  );
};
