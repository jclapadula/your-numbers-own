import { useEffect, useState, type RefObject } from "react";

type NavigableItem = {
  id: string;
};

type UseDropdownArrowNavigationProps<T extends NavigableItem> = {
  items: T[];
  /** Attribute used to locate the id of the element to focus */
  dataAttribute: string;
  containerRef: RefObject<HTMLElement | null>;
};

export const useDropdownArrowNavigation = <T extends NavigableItem>({
  items,
  dataAttribute,
  containerRef,
}: UseDropdownArrowNavigationProps<T>) => {
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    setFocusedItemIndex(null);
  }, [items]);

  useEffect(() => {
    if (focusedItemIndex !== null && items[focusedItemIndex]) {
      const { id: itemId } = items[focusedItemIndex];
      itemId &&
        containerRef.current
          ?.querySelector<HTMLButtonElement>(`[${dataAttribute}="${itemId}"]`)
          ?.focus();
    }
  }, [focusedItemIndex, items, dataAttribute, containerRef]);

  const focusOnNextElement = () => {
    const nextIndex =
      focusedItemIndex === null ? 0 : (focusedItemIndex + 1) % items.length;
    setFocusedItemIndex(nextIndex);
  };

  const focusOnPreviousElement = () => {
    const nextIndex =
      focusedItemIndex === null
        ? items.length - 1
        : (focusedItemIndex - 1 + items.length) % items.length;
    setFocusedItemIndex(nextIndex);
  };

  const resetArrowsFocus = () => {
    setFocusedItemIndex(null);
  };

  return {
    setFocusedItemIndex,
    focusOnNextElement,
    focusOnPreviousElement,
    resetArrowsFocus,
  };
};
