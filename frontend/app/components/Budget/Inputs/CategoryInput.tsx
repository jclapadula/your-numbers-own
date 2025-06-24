import { useEffect, useRef, useState } from "react";
import { useCategories } from "../Categories/CategoriesQueries";
import { useCategoryGroups } from "../Categories/CategoryGroupsQueries";

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
  const { data: categories = [] } = useCategories();
  const { data: categoryGroups = [] } = useCategoryGroups();
  const [searchTerm, setSearchTerm] = useState(value || "");

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        divRef.current !== event.target &&
        !divRef.current?.contains(event.target as Node)
      ) {
        onBlur();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  return (
    <div className="dropdown" ref={divRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        placeholder="Search categories..."
        className="input input-bordered w-full h-auto pl-0"
        autoFocus
      />
      <ul
        tabIndex={0}
        className="dropdown-content menu p-0 shadow bg-base-300 rounded overflow-hidden mt-1 w-max max-w-xs"
      >
        {categoryGroups.map((group) => {
          const groupCategories = filteredCategories
            .filter((category) => category.groupId === group.id)
            .sort((a, b) => a.position - b.position);

          if (groupCategories.length === 0) {
            return null;
          }

          return (
            <>
              <li
                key={group.id}
                className="menu-disabled -ml-1 !text-base-content/50"
              >
                <span>{group.name}</span>
              </li>
              {groupCategories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategorySelected(category.id);
                    }}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </>
          );
        })}
      </ul>
    </div>
  );
};
