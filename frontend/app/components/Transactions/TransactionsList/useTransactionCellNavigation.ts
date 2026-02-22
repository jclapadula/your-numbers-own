import { useRef } from "react";

const TransactionCellDataType = "transaction-cell";

const focusNextTransactionCell = (
  currentCell: HTMLElement,
  direction: "next" | "prev" | "down",
) => {
  const selector = `[data-type="${TransactionCellDataType}"]`;
  const allCells = [...document.querySelectorAll(selector)] as HTMLElement[];
  const visibleCells = allCells.filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === currentCell,
  );

  const currentIndex = visibleCells.indexOf(currentCell);
  if (currentIndex < 0) return;

  if (direction === "down") {
    const currentColumn = currentCell.dataset.column;
    const columnCells = visibleCells.filter(
      (el) => el.dataset.column === currentColumn,
    );
    const columnIndex = columnCells.indexOf(currentCell);
    columnCells.at(columnIndex + 1)?.focus();
  } else {
    const nextIndex =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;
    visibleCells.at(nextIndex)?.focus();
  }
};

export const useTransactionCellNavigation = (column: number) => {
  const cellRef = useRef<HTMLDivElement>(null);

  const navigate = (direction: "next" | "prev" | "down") => {
    if (cellRef.current) focusNextTransactionCell(cellRef.current, direction);
  };

  const getInputKeyDownHandler =
    (blurAndSave: () => void) => (e: React.KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        blurAndSave();
        navigate(e.shiftKey ? "prev" : "next");
      } else if (e.key === "Enter") {
        blurAndSave();
        navigate("down");
      }
    };

  const getDropdownKeyDownHandler = () => (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      navigate(e.shiftKey ? "prev" : "next");
    }
  };

  const cellProps = {
    ref: cellRef,
    "data-type": TransactionCellDataType,
    "data-column": String(column),
  } as const;

  return { cellProps, getInputKeyDownHandler, getDropdownKeyDownHandler };
};
