"use client";

import { useState } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { BankLogo } from "@/components/ui/bank-badge";
import { Icon } from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BANKS, bankLabel, findBank } from "@/configs/banks";
import { CATEGORIES, UNCATEGORISED } from "@/configs/categories";
import { cn } from "@/utils/cn";
import { formatMonth } from "@/utils/format";

export type ReviewFilter = "all" | "needs_review";

/** Radix Select items cannot use an empty value, so "no filter" gets a sentinel. */
const ALL = "__all__";

export function TransactionFilters({
  filter,
  category,
  bank,
  month,
  q,
  months,
  banks,
  needsReviewCount,
  onChange,
}: {
  filter: ReviewFilter;
  category: string;
  bank: string;
  month: string;
  q: string;
  months: string[];
  /** Banks in the data. Without them, every known bank is offered. */
  banks?: string[];
  needsReviewCount: number;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const [search, setSearch] = useState(q);
  const bankOptions = (banks?.length ? banks : BANKS.map((b) => b.slug))
    .map((value) => {
      const known = findBank(value);
      return { value: known?.slug ?? value, label: known ? bankLabel(known.name, known.short) : value };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const selectClass = "h-9 rounded-full border-line-strong bg-panel px-3.5 text-[13px] dark:bg-panel";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Show" className="inline-flex rounded-full border border-line bg-panel-raised/60 p-0.5">
        {(["all", "needs_review"] as ReviewFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => onChange({ filter: f === "all" ? null : f })}
            className={cn(
              "h-8 rounded-full px-3 text-[13px] font-medium",
              filter === f ? "bg-panel text-foreground shadow-sm" : "text-t3 hover:text-foreground",
            )}
          >
            {f === "all" ? "All" : `Needs review (${needsReviewCount})`}
          </button>
        ))}
      </div>

      <Select value={category || ALL} onValueChange={(v) => onChange({ category: v === ALL ? null : v })}>
        <SelectTrigger aria-label="Category" className={selectClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl">
          <SelectItem value={ALL} className="text-[13px]">
            All categories
          </SelectItem>
          {[...CATEGORIES, UNCATEGORISED].map((c) => (
            <SelectItem key={c} value={c} className="text-[13px]">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={bank || ALL} onValueChange={(v) => onChange({ bank: v === ALL ? null : v })}>
        <SelectTrigger aria-label="Bank" className={selectClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-80 rounded-xl">
          <SelectItem value={ALL} className="text-[13px]">
            All banks
          </SelectItem>
          {bankOptions.map((b) => (
            <SelectItem key={b.value} value={b.value} className="text-[13px]">
              <BankLogo bank={b.value} className="size-4.5" />
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {months.length > 0 && (
        <Select value={month || ALL} onValueChange={(v) => onChange({ month: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Month" className={selectClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="rounded-xl">
            <SelectItem value={ALL} className="text-[13px]">
              All months
            </SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m} className="text-[13px]">
                {formatMonth(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <form
        role="search"
        className="relative min-w-[12rem] flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ q: search.trim() || null });
        }}
      >
        <label htmlFor="txn-search" className="sr-only">
          Search descriptions
        </label>
        <Icon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-t4" />
        <input
          id="txn-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search descriptions"
          className="h-9 w-full rounded-full border border-line-strong bg-panel pr-3 pl-9 text-[13px]"
        />
      </form>
    </div>
  );
}
