import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { cn } from "@/utils/cn";

export type { IconSvgElement };

/** Decorative icon. Meaning always lives in nearby text. */
export function Icon({
  icon,
  className,
  strokeWidth = 1.8,
}: {
  icon: IconSvgElement;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      className={cn("size-4 shrink-0", className)}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}
