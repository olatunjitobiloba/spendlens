import { Tick02Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/utils/cn";

export type ImportStep = "choose" | "check" | "done";

const steps: { id: ImportStep; label: string }[] = [
  { id: "choose", label: "Choose file" },
  { id: "check", label: "Check and confirm" },
  { id: "done", label: "Imported" },
];

export function Stepper({ step }: { step: ImportStep }) {
  const at = steps.findIndex((s) => s.id === step);
  return (
    <ol className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px]" aria-label="Import progress">
      {steps.map((s, i) => (
        <li
          key={s.id}
          aria-current={i === at ? "step" : undefined}
          className={cn("flex items-center gap-2", i <= at ? "text-foreground" : "text-t4")}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-full border font-mono text-[11.5px]",
              i < at && "border-brand bg-brand/12 text-brand",
              i === at && "border-foreground",
              i > at && "border-line-strong",
            )}
          >
            {i < at ? <Icon icon={Tick02Icon} className="size-3.5" strokeWidth={2.2} /> : i + 1}
          </span>
          {s.label}
          {i < at && <span className="sr-only">(done)</span>}
        </li>
      ))}
    </ol>
  );
}
