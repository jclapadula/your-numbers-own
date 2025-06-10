import { twMerge } from "tailwind-merge";

export const CategoryCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={twMerge("w-50 border-r border-neutral-content/20", className)}
    >
      {children}
    </div>
  );
};

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
