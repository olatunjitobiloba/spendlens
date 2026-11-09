import { Icon, type IconSvgElement } from "./icon";

export function EmptyState({
  title,
  children,
  action,
  icon,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: IconSvgElement;
}) {
  return (
    <div className="flex flex-col items-center rounded-[1.25rem] border border-dashed border-line-strong px-6 py-10 text-center">
      {icon && (
        <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.05] text-t3">
          <Icon icon={icon} className="size-5" />
        </span>
      )}
      <p className="text-[15px] font-[600]">{title}</p>
      {children && <div className="mt-1 max-w-md text-[13.5px] text-t3">{children}</div>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
