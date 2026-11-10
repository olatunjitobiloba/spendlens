import { cn } from "@/utils/cn";
import { fmt } from "@/utils/format";

/** Shows a kobo value exactly as the API sent it. Never computes (PRD R1). */
export function Money({ kobo, className, sign }: { kobo: number; className?: string; sign?: "minus" }) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {sign === "minus" ? "−" : ""}
      {fmt(kobo)}
    </span>
  );
}
