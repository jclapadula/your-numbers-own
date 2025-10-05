import type { PropsWithChildren, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type TooltipProps = {
  content: string | ReactNode;
  position?: "bottom";
};

export const Tooltip = ({
  content,
  position,
  children,
}: PropsWithChildren<TooltipProps>) => {
  return (
    <div
      className={twMerge("tooltip", position === "bottom" && "tooltip-bottom")}
    >
      <div className="tooltip-content">{content}</div>
      {children}
    </div>
  );
};
