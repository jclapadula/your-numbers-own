import { Fragment, useEffect, useRef, useState } from "react";
import { useCategories } from "../Categories/CategoriesQueries";
import { useCategoryGroups } from "../CategoryGroups/CategoryGroupsQueries";
import { twMerge } from "tailwind-merge";
import type { Category } from "~/api/models";

type CategoryInputProps = {
  value: string | null;
  onCategorySelected: (categoryId: string) => void;
  onBlur?: () => void;
  variant?: "compact" | "full";
  autoFocus?: boolean;

  /** To prevent the closing of the dropdown when clicking in its container */
  containerRef?: React.RefObject<HTMLElement | null>;

  categoryFilter?: (category: Category) => boolean;
};

export const CategorySelect = ({
  value,
  onCategorySelected,
  onBlur,
  variant = "compact",
  autoFocus = false,
  containerRef,
  categoryFilter = () => true,
}: CategoryInputProps) => {
  const { data: categories = [] } = useCategories();
  const { data: categoryGroups = [] } = useCategoryGroups();
  const [searchTerm, setSearchTerm] = useState(value || "");

  const filteredCategories = categories
    .filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(categoryFilter);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef?.current?.contains(event.target as Node)) {
        onBlur?.();
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
    <>
      {!autoFocus && (
        <input
          name="autoFocusStealer"
          type="text"
          className="opacity-0 h-0 w-0"
        />
      )}
      <div className="dropdown">
        <input
          name="category"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          placeholder="Search categories..."
          className={twMerge(
            "input input-bordered w-full h-auto pl-0",
            variant === "full" && "!input"
          )}
          autoFocus={autoFocus}
        />
        <ul
          className={twMerge(
            "dropdown-content menu p-0 shadow bg-base-300 rounded mt-1",
            "w-max max-w-xs max-h-[250px] overflow-y-scroll flex-nowrap min-w-full"
          )}
        >
          {categoryGroups.map((group) => {
            const groupCategories = filteredCategories
              .filter((category) => category.groupId === group.id)
              .sort((a, b) => a.position - b.position);

            if (groupCategories.length === 0) {
              return null;
            }

            return (
              <Fragment key={group.id}>
                <li
                  key={group.id}
                  className="menu-disabled -ml-1 !text-base-content/50"
                >
                  <span className="text-[13px]">{group.name}</span>
                </li>
                {groupCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategorySelected(category.id);
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      className="text-[13px]"
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </Fragment>
            );
          })}
        </ul>
      </div>
    </>
  );
};
