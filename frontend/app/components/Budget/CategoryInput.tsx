import { useEffect, useRef, useState } from "react";
import { useCategories } from "./budgetQueries";

type CategoryInputProps = {
  value: string | null;
  onCategorySelected: (categoryId: string) => void;
  onBlur: () => void;
};

export const CategoryInput = ({
  value,
  onCategorySelected,
  onBlur,
}: CategoryInputProps) => {
  const { data: categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const wasOpen = useRef(false);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen && wasOpen.current) {
      setTimeout(() => {
        onBlur();
      }, 100);
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  return (
    <div className="dropdown">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholder="Search categories..."
        className="input input-bordered w-full h-auto pl-0"
        autoFocus
      />
      {isOpen && (
        <ul
          tabIndex={0}
          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full mt-1"
        >
          {filteredCategories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => {
                  onCategorySelected(category.id);
                  setIsOpen(false);
                }}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
