import { Icon, type IconSvgElement } from "./icon";

/** KPI tile: label and icon on top, one big value, one line of context. */
export function StatTile({
  label,
  icon,
  value,
  caption,
}: {
  label: string;
  icon: IconSvgElement;
  value: React.ReactNode;
  caption: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-t3">{label}</p>
        <Icon icon={icon} className="size-4 text-t3" />
      </div>
      <p className="mt-3 truncate text-[17px] leading-tight font-[600] tracking-[-0.03em] tabular-nums sm:text-[22px] xl:text-[24px]">
        {value ?? <span className="text-t4">—</span>}
      </p>
      <p className="mt-1 truncate text-[12.5px] text-t3">{caption}</p>
    </div>
  );
}
