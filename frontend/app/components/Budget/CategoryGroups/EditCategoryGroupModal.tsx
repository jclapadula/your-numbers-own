import { useState, useEffect } from "react";
import { Modal } from "../../Common/Modal";
import { useUpdateCategoryGroup } from "./CategoryGroupsQueries";
import type { CategoryGroup } from "~/api/models";

export const EditCategoryGroupModal = ({
  onClose,
  categoryGroup,
}: {
  onClose: () => void;
  categoryGroup: CategoryGroup;
}) => {
  const [name, setName] = useState(categoryGroup.name);
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: updateCategoryGroup, isPending } =
    useUpdateCategoryGroup();

  // Update the name when the categoryGroup prop changes
  useEffect(() => {
    setName(categoryGroup.name);
  }, [categoryGroup.name]);

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name.trim()) {
      setIsValid(false);
      return;
    }

    // Only update if the name has actually changed
    if (name.trim() !== categoryGroup.name) {
      await updateCategoryGroup({ id: categoryGroup.id, name: name.trim() });
    }

    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Edit Category Group"
      onSave={handleSave}
      disabled={isPending}
    >
      <form onSubmit={handleSave}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Category group name</legend>
          <input
            type="text"
            className="input"
            placeholder="Like Fixed Expenses or Savings"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {!isValid && (
            <div className="text-error">Enter a category group name</div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
};
