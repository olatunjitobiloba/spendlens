"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Status } from "@/components/ui/status";
import { asApiError } from "@/hooks/use-resource";
import { api, type ApiError } from "@/lib/api";
import { useIsPro } from "@/providers/me-provider";
import type { Scenario } from "@/types/api";
import { formatMonth } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

/** Saving is Pro. Free sees the scenario but cannot keep it. */
export function SaveScenario({ scenario, onSaved }: { scenario: Scenario; onSaved: () => void }) {
  const isPro = useIsPro();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isPro) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-t3">
        <Status tone="brand">Pro</Status>
        Save scenarios and compare them later.
        <Link href="/insights/pro" className="font-medium text-primary underline-offset-4 hover:underline">
          Unlock Pro
        </Link>
      </p>
    );
  }
  if (saved) return <Notice tone="positive" title="Scenario saved" />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createScenario({
        range: scenario.range,
        cuts: scenario.categories.filter((c) => c.percent > 0).map((c) => ({ category: c.category, percent: c.percent })),
        save: true,
        name,
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(asApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={save}>
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="scenario-name" className="text-[12.5px] text-t3">
          Name this scenario
        </label>
        <input
          id="scenario-name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Plan for ${formatMonth(scenario.range.start.slice(0, 7))}`}
          className="mt-1 h-9 w-full rounded-xl border border-line-strong bg-panel px-3 text-[13px]"
        />
      </div>
      <Button type="submit" variant="outline" disabled={busy}>
        {busy ? "Saving…" : "Save scenario"}
      </Button>
      {error && <ErrorNotice error={error} className="w-full" />}
    </form>
  );
}
