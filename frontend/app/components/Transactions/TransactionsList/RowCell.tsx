import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const RowCell = forwardRef(
  (
    {
      children,
      className,
      style,
      onClick,
      onFocus,
      grows,
    }: {
      children: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
      onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
      grows?: boolean;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div
        className={twMerge(
          "px-2 py-1 text-ellipsis overflow-clip",
          grows && "flex-auto basis-0",
          className
        )}
        style={style}
        onClick={onClick}
        onFocus={onFocus}
        tabIndex={0}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);
