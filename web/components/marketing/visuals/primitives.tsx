import Image from "next/image";

import { avatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function Avatar({
  seed,
  name,
  size = 36,
  className,
}: {
  seed: string;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={avatarUrl(seed)}
      alt={`Avatar for ${name}`}
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 rounded-full border border-line bg-panel-raised", className)}
    />
  );
}

/** A small product card used inside previews. */
export function MockCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line-strong bg-panel p-4 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Front card with two faint cards fanned behind it, as in a stack of records. */
export function Deck({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative w-full max-w-[340px]", className)}>
      <div
        aria-hidden="true"
        className="absolute inset-x-3 -top-5 h-full rotate-[-4deg] rounded-2xl border border-line bg-panel-raised/60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-1.5 -top-2.5 h-full rotate-[-2deg] rounded-2xl border border-line bg-panel-raised"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Words first, colour second (frontend PRD R3). */
export function Status({
  tone,
  children,
}: {
  tone: "positive" | "warn" | "neutral" | "brand";
  children: React.ReactNode;
}) {
  const tones = {
    positive: "bg-positive/12 text-positive",
    warn: "bg-warn/12 text-warn",
    neutral: "bg-foreground/[0.06] text-t3",
    brand: "bg-brand/12 text-brand",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
