"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMonth } from "@/utils/format";

/** Month picker that keeps the choice in the URL so it is shareable. */
export function MonthSelect({ months, month }: { months: string[]; month: string }) {
  const router = useRouter();
  const params = useSearchParams();
  if (months.length < 2) return null;
  return (
    <div className="inline-flex items-center gap-2 text-[13px] text-t3">
      <span id="month-select-label">Month</span>
      <Select
        value={month}
        onValueChange={(value) => {
          const next = new URLSearchParams(params.toString());
          next.set("month", value);
          router.replace(`?${next.toString()}`, { scroll: false });
        }}
      >
        <SelectTrigger
          aria-labelledby="month-select-label"
          className="h-9 min-w-36 rounded-full border-line-strong bg-panel px-3.5 text-[13px] text-foreground dark:bg-panel"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end" className="rounded-xl">
          {months.map((m) => (
            <SelectItem key={m} value={m} className="text-[13px]">
              {formatMonth(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
