import { cn } from "@/utils/cn";
import { Icon, type IconSvgElement } from "./icon";

/** Dashed inset with an icon tile, a title, one line of help and an optional action. */
export function EmptyState({
  title,
  children,
  action,
  icon,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: IconSvgElement;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-4 inline-flex size-10 items-center justify-center rounded-xl border border-line-strong bg-panel-raised text-t2">
          <Icon icon={icon} className="size-[18px]" />
        </span>
      )}
      <p className="text-[14px] font-[600]">{title}</p>
      {children && <div className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-t3">{children}</div>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
