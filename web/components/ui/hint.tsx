"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * Generic tooltip for any element: wrap the trigger and pass what to show.
 * The child must accept a ref and focus/hover handlers (a link, button or span
 * with tabIndex). Keep the label short; meaning that matters belongs in text.
 */
export function Hint({
  label,
  children,
  side = "top",
  align = "center",
  sideOffset = 6,
  disabled,
}: {
  label: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  disabled?: boolean;
}) {
  if (disabled || label == null || label === "") return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} sideOffset={sideOffset} className="text-[12px] font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
