"use client";

import { useState } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { CATEGORIES, UNCATEGORISED } from "@/configs/categories";
import { cn } from "@/utils/cn";
import { formatMonth } from "@/utils/format";

export type ReviewFilter = "all" | "needs_review";

export function TransactionFilters({
  filter,
  category,
  month,
  q,
  months,
  needsReviewCount,
  onChange,
}: {
  filter: ReviewFilter;
  category: string;
  month: string;
  q: string;
  months: string[];
  needsReviewCount: number;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const [search, setSearch] = useState(q);
  const selectClass = "h-9 rounded-full border border-line-strong bg-panel px-3 text-[13px]";

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

      <label className="sr-only" htmlFor="cat-filter">
        Category
      </label>
      <select
        id="cat-filter"
        value={category}
        onChange={(e) => onChange({ category: e.target.value || null })}
        className={selectClass}
      >
        <option value="">All categories</option>
        {[...CATEGORIES, UNCATEGORISED].map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {months.length > 0 && (
        <>
          <label className="sr-only" htmlFor="month-filter">
            Month
          </label>
          <select
            id="month-filter"
            value={month}
            onChange={(e) => onChange({ month: e.target.value || null })}
            className={selectClass}
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </>
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
