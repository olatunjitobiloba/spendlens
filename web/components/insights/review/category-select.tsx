"use client";

import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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

  async function change(category: string) {
    setSaving(true);
    setError(null);
    try {
      onSaved(await api.updateTransaction(t.id, { category }));
    } catch (err) {
      setError(asApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Select value={t.category ?? ""} onValueChange={change} disabled={saving}>
        <SelectTrigger
          aria-label={`Category for ${t.description}`}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-8 w-full max-w-[11rem] rounded-full bg-panel px-3 text-[13px] dark:bg-panel",
            t.category ? "border-line-strong" : "border-warn/60",
          )}
        >
          <SelectValue placeholder="Choose a category" />
          {saving && <Spinner className="ml-auto size-3.5 text-t3" />}
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl">
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="text-[13px]">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="mt-1 text-[12px] text-destructive">
          Not saved: {error}
        </p>
      )}
    </div>
  );
}
