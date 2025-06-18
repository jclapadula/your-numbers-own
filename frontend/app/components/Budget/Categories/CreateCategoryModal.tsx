import { useState } from "react";
import { Modal } from "../../Common/Modal";
import { useCreateCategory } from "./CategoriesQueries";

export const CreateCategoryModal = ({
  onClose,
  categoryGroupId,
}: {
  onClose: () => void;
  categoryGroupId: string;
}) => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(true);
  const { mutateAsync: createCategory, isPending } = useCreateCategory();

  const handleSave = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!name.trim()) {
      setIsValid(false);
      return;
    }

    await createCategory({ name: name.trim(), categoryGroupId });
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Create Category"
      onSave={handleSave}
      disabled={isPending}
    >
      <form onSubmit={handleSave}>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Your category name</legend>
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
