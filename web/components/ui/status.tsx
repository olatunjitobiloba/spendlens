import { cn } from "@/utils/cn";

export type Tone = "positive" | "warn" | "neutral" | "brand" | "danger";

const tones: Record<Tone, string> = {
  positive: "bg-positive/12 text-positive",
  warn: "bg-warn/12 text-warn",
  neutral: "bg-foreground/[0.06] text-t3",
  brand: "bg-brand/12 text-brand",
  danger: "bg-destructive/12 text-destructive",
};

/** Words first, colour second (PRD R3). */
export function Status({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
