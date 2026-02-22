import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const CategoryCell = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={twMerge("w-50 border-r border-neutral-content/20", className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export const BudgetedCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={twMerge("grow basis-1/3 text-right", className)}>
      {children}
    </div>
  );
};

export const SpentCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={twMerge("grow basis-1/3 text-right", className)}>
      {children}
    </div>
  );
};

export const BalanceCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={twMerge("grow basis-1/3 text-right", className)}>
      {children}
    </div>
  );
};
