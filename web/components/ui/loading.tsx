import { Loading03Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/utils/cn";
import { Icon } from "./icon";

export function Spinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-[13px] text-t3", className)}>
      <Icon icon={Loading03Icon} className="animate-spin motion-reduce:animate-none" />
      {label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-foreground/[0.06] motion-reduce:animate-none", className)}
    />
  );
}

export function LoadingBlock({ label = "Loading", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-3 rounded-[1.25rem] border border-line bg-panel p-5">
      <Spinner label={label} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-5" />
      ))}
    </div>
  );
}
