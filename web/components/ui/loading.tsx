import { Loading03Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/utils/cn";
import { Icon } from "./icon";

export { Skeleton } from "./skeleton";

/**
 * Inline spinner with a label, for small in-place waits (a button, a row being
 * saved). Page and section loads use skeletons instead.
 */
export function Spinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-[13px] text-t3", className)}>
      <Icon icon={Loading03Icon} className="animate-spin motion-reduce:animate-none" />
      {label}
    </span>
  );
}
