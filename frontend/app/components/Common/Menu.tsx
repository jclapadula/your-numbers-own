import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type MenuProps = {
  children: ReactNode;
  className?: string;
};

export const Menu = ({ children, className }: MenuProps) => {
  return (
    <div className={twMerge("dropdown", className)}>
      <div
        tabIndex={-1}
        role="button"
        className={"btn btn-xs btn-primary btn-soft px-1.5"}
      >
        <ChevronDownIcon className="w-3 h-3" />
      </div>
      <ul
        tabIndex={0}
        className={twMerge(
          "dropdown-content menu p-0 shadow bg-base-300 rounded overflow-hidden mt-1 z-50"
        )}
      >
        {children}
      </ul>
    </div>
  );
};

type MenuItemProps = {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export const MenuItem = ({
  onClick,
  children,
  disabled = false,
  className,
}: MenuItemProps) => {
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className={twMerge(
          "w-full text-left overflow-clip text-nowrap",
          className
        )}
      >
        {children}
      </button>
    </li>
  );
};
