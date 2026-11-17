import { Alert02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/utils/cn";
import { Icon } from "./icon";

/** The message under an input. Link it with aria-describedby on the input. */
export function FieldError({ id, children, className }: { id: string; children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn("mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-destructive", className)}>
      <Icon icon={Alert02Icon} className="mt-px size-3.5" />
      <span>{children}</span>
    </p>
  );
}
