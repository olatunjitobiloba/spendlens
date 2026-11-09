"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { formatMonth } from "@/utils/format";

/** Month picker that keeps the choice in the URL so it is shareable. */
export function MonthSelect({ months, month }: { months: string[]; month: string }) {
  const router = useRouter();
  const params = useSearchParams();
  if (months.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-t3">
      Month
      <select
        value={month}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("month", e.target.value);
          router.replace(`?${next.toString()}`, { scroll: false });
        }}
        className="h-9 rounded-full border border-line-strong bg-panel px-3 text-[13px] text-foreground"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {formatMonth(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
