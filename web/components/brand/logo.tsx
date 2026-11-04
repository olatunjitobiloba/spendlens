import { cn } from "@/lib/utils";

/**
 * SpendLens mark: a lens ring with one slice of spend inside it.
 * Path data is shared with the favicon (app/icon.svg) and the OG image.
 */
export const LOGO_RING = { cx: 16, cy: 16, r: 8, stroke: 3 };
export const LOGO_SLICE = "M16 16V11.5A4.5 4.5 0 0 1 20.5 16Z";

export function LogoMark({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="#007BF5" />
      <circle
        cx={LOGO_RING.cx}
        cy={LOGO_RING.cy}
        r={LOGO_RING.r}
        fill="none"
        stroke="#fff"
        strokeWidth={LOGO_RING.stroke}
      />
      <path d={LOGO_SLICE} fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[17px] font-[650] tracking-[-0.03em]",
        className,
      )}
    >
      <LogoMark />
      spendlens
    </span>
  );
}
