import { cn } from "@/utils/cn";

/** Share bar. `pct` comes from the API (share_pct); the UI never derives it. */
export function Bar({ pct, muted }: { pct: number; muted?: boolean }) {
  return (
    <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
      <span
        className={cn("block h-full rounded-full", muted ? "bg-t4" : "bg-brand")}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </span>
  );
}
