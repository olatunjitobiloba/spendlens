"use client";

import { useState } from "react";
import Image from "next/image";

import { bankLabel, bankLogo, findBank } from "@/configs/banks";
import { cn } from "@/utils/cn";
import { Hint } from "./hint";

/**
 * Bank logo plus name. Long names show their short form, with the full name
 * in a tooltip. An unknown bank falls back to its initials.
 */
export function BankBadge({ bank, className }: { bank: string | null | undefined; className?: string }) {
  const known = findBank(bank);
  const [broken, setBroken] = useState(false);
  if (!bank) return <span className="text-t4">—</span>;

  const name = known?.name ?? bank;
  const label = bankLabel(name, known?.short);
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Hint label={name} disabled={label === name}>
      <span
        tabIndex={label === name ? undefined : 0}
        className={cn("inline-flex max-w-full items-center gap-2 rounded-md whitespace-nowrap", className)}
      >
        {known && !broken ? (
          <Image
            src={bankLogo(known)}
            alt=""
            width={20}
            height={20}
            onError={() => setBroken(true)}
            className="size-5 shrink-0 rounded-md bg-white object-contain ring-1 ring-line"
          />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-brand/12 text-[9px] font-[700] text-brand"
          >
            {initials}
          </span>
        )}
        <span className="truncate">{label}</span>
        {label !== name && <span className="sr-only">({name})</span>}
      </span>
    </Hint>
  );
}
