import { Alert02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/utils/cn";
import { Icon } from "./icon";

type NoticeTone = "neutral" | "warn" | "danger" | "positive";

const tones: Record<NoticeTone, string> = {
  neutral: "border-line bg-panel-raised/60",
  warn: "border-warn/30 bg-warn/[0.07]",
  danger: "border-destructive/30 bg-destructive/[0.06]",
  positive: "border-positive/30 bg-positive/[0.07]",
};

const iconTones: Record<NoticeTone, string> = {
  neutral: "text-t3",
  warn: "text-warn",
  danger: "text-destructive",
  positive: "text-positive",
};

export function Notice({
  tone = "neutral",
  title,
  children,
  action,
  role,
  className,
}: {
  tone?: NoticeTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  role?: React.AriaRole;
  className?: string;
}) {
  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : undefined)}
      className={cn("flex flex-wrap items-start gap-x-3 gap-y-2 rounded-2xl border px-4 py-3", tones[tone], className)}
    >
      <Icon
        icon={tone === "neutral" || tone === "positive" ? InformationCircleIcon : Alert02Icon}
        className={cn("mt-0.5", iconTones[tone])}
      />
      <div className="min-w-0 flex-1 text-[13.5px]">
        {title && <p className="font-[600]">{title}</p>}
        {children && <div className="text-t2">{children}</div>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
