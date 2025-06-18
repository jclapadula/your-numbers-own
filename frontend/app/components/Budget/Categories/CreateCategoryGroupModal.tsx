import { useState } from "react";
import { Modal } from "../../Common/Modal";
import { useCreateCategoryGroup } from "./CategoryGroupsQueries";

export const CreateCategoryGroupModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: createCategoryGroup, isPending } =
    useCreateCategoryGroup();

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name.trim()) {
      setIsValid(false);
      return;
    }

    await createCategoryGroup({ name: name.trim() });
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Create Category Group"
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
