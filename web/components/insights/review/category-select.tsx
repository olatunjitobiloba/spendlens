"use client";

import { useState } from "react";

import { CATEGORIES, UNCATEGORISED } from "@/configs/categories";
import { asApiError } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { Transaction } from "@/types/api";
import { cn } from "@/utils/cn";

/** Inline category correction, saved with PATCH (technical doc §7). */
export function CategorySelect({ t, onSaved }: { t: Transaction; onSaved: (t: Transaction) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (t.direction === "credit") return <span className="text-[13px] text-t3">{t.category ?? "Money in"}</span>;
  if (t.review_state === "duplicate") return <span className="text-[13px] text-t3">{t.category ?? UNCATEGORISED}</span>;

  return (
    <div>
      <label className="sr-only" htmlFor={`cat-${t.id}`}>
        Category for {t.description}
      </label>
      <select
        id={`cat-${t.id}`}
        value={t.category ?? ""}
        disabled={saving}
        aria-invalid={Boolean(error)}
        onChange={async (e) => {
          setSaving(true);
          setError(null);
          try {
            onSaved(await api.updateTransaction(t.id, { category: e.target.value }));
          } catch (err) {
            setError(asApiError(err).message);
          } finally {
            setSaving(false);
          }
        }}
        className={cn(
          "h-8 w-full max-w-[11rem] rounded-lg border bg-panel px-2 text-[13px]",
          t.category ? "border-line-strong" : "border-warn/60",
        )}
      >
        {!t.category && <option value="">Choose a category</option>}
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-[12px] text-destructive">
          Not saved: {error}
        </p>
      )}
    </div>
  );
}
