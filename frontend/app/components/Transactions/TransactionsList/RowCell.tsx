import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

type RowCellProps = ComponentPropsWithoutRef<"div"> & {
  grows?: boolean;
};

export const RowCell = forwardRef<HTMLDivElement, RowCellProps>(
  ({ children, className, grows, ...rest }, ref) => {
    return (
      <div
        {...rest}
        className={twMerge(
          "px-2 py-1",
          grows && "flex-auto basis-0",
          className,
        )}
        tabIndex={0}
        ref={ref}
      >
        {children}
      </div>
    );
  },
);
