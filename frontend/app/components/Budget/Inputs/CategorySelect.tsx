import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import type { Category } from "~/api/models";
import { useDropdownArrowNavigation } from "../../Common/useDropdownArrowNavigation";
import { useCategories } from "../Categories/CategoriesQueries";
import { useCategoryGroups } from "../CategoryGroups/CategoryGroupsQueries";

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

const noFilter = () => true;

const sortCategoriesByGroupOrder = (
  categoryGroups: { id: string; position: number }[],
) => {
  return (a: Category, b: Category) => {
    const groupA = categoryGroups.find((g) => g.id === a.groupId);
    const groupB = categoryGroups.find((g) => g.id === b.groupId);

    if (!groupA || !groupB) return 0;

    // First sort by group position
    if (groupA.position !== groupB.position) {
      return groupA.position - groupB.position;
    }

    // Then sort by category position within group
    return a.position - b.position;
  };
};

export const CategorySelect = ({
  value,
  onCategorySelected,
  onBlur,
  variant = "compact",
  autoFocus = false,
  containerRef,
  categoryFilter = noFilter,
}: CategoryInputProps) => {
  const { data: categories = [] } = useCategories();
  const { data: categoryGroups = [] } = useCategoryGroups();
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [stagedCategory, setStagedCategory] = useState<Category | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter(categoryFilter)
      .sort(sortCategoriesByGroupOrder(categoryGroups));
  }, [categories, searchTerm, categoryFilter, categoryGroups]);

  const divRef = useRef<HTMLDivElement>(null);

  const {
    setFocusedItemIndex,
    focusOnNextElement,
    focusOnPreviousElement,
    resetArrowsFocus,
  } = useDropdownArrowNavigation({
    items: filteredCategories,
    dataAttribute: "data-categoryId",
    containerRef: divRef,
  });

  const handleBlur = useCallback(() => {
    onBlur?.();
    resetArrowsFocus();
  }, [onBlur, resetArrowsFocus]);

  const confirmAndBlur = useCallback(() => {
    if (stagedCategory) {
      onCategorySelected(stagedCategory.id);
    }
    handleBlur();
  }, [stagedCategory, onCategorySelected, handleBlur]);

  const stageCategory = useCallback((category: Category) => {
    setStagedCategory(category);
    setSearchTerm(category.name);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        divRef.current !== event.target &&
        !divRef.current?.contains(event.target as Node) &&
        !containerRef?.current?.contains(event.target as Node)
      ) {
        confirmAndBlur();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [confirmAndBlur, containerRef]);

  useEffect(() => {
    setSearchTerm(value || "");
    setStagedCategory(null);
    setIsDropdownOpen(true);
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
      <div
        className="dropdown"
        ref={divRef}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            confirmAndBlur();
          }
          if (e.key === "ArrowDown") {
            setIsDropdownOpen(true);
            focusOnNextElement();
            e.preventDefault();
          }
          if (e.key === "ArrowUp") {
            setIsDropdownOpen(true);
            focusOnPreviousElement();
            e.preventDefault();
          }
          if (e.key === "Escape") {
            handleBlur();
          }
          if (e.key === "Enter") {
            if (document.activeElement === inputRef.current) {
              confirmAndBlur();
              // let bubble → parent navigates down
            } else {
              // focused on a dropdown button — stage it without navigating
              e.stopPropagation();
              e.preventDefault();
              const categoryId = (e.target as HTMLElement).getAttribute("data-categoryId");
              const found = filteredCategories.find((c) => c.id === categoryId);
              if (found) {
                stageCategory(found);
              }
            }
          }
        }}
      >
        <input
          ref={inputRef}
          name="category"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
            setStagedCategory(null);
          }}
          placeholder="Search categories..."
          className={twMerge(
            "input input-bordered w-full h-auto pl-0",
            variant === "full" && "input!",
          )}
          autoFocus={autoFocus}
        />
        {isDropdownOpen && (
          <ul
            className={twMerge(
              "dropdown-content menu p-0 shadow bg-base-300 rounded mt-1",
              "w-max max-w-xs max-h-[250px] overflow-y-scroll flex-nowrap min-w-full",
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
                    className="menu-disabled -ml-1 text-base-content/50!"
                  >
                    <span className="text-[13px]">{group.name}</span>
                  </li>
                  {groupCategories.map((category) => {
                    const categoryIndex = filteredCategories.findIndex(
                      (c) => c.id === category.id,
                    );
                    return (
                      <li key={category.id}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            stageCategory(category);
                          }}
                          onFocus={() => setFocusedItemIndex(categoryIndex)}
                          data-categoryId={category.id}
                          className="text-[13px]"
                        >
                          {category.name}
                        </button>
                      </li>
                    );
                  })}
                </Fragment>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};
