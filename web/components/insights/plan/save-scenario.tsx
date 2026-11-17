"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { Status } from "@/components/ui/status";
import { FieldError } from "@/components/ui/field-error";
import { showToast } from "@/components/ui/toast";
import { api, asApiError } from "@/lib/api";
import { useIsPro } from "@/providers/me-provider";
import type { Scenario } from "@/types/api";
import { formatMonth } from "@/utils/format";
import { toastApiError } from "../shared/error-toast";

/** Saving is Pro. Free sees the scenario but cannot keep it. */
export function SaveScenario({ scenario, onSaved }: { scenario: Scenario; onSaved: () => void }) {
  const isPro = useIsPro();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isPro) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-t3">
        <Link href="/insights/pro" className="font-medium text-primary underline-offset-4 hover:underline">
          Unlock Pro
        </Link>
      </p>
    );
  }
  if (saved) return <Notice tone="positive" title="Scenario saved" />;

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setNameError(null);
    try {
      await api.plan.createScenario({
        range: scenario.range,
        cuts: scenario.categories.filter((c) => c.percent > 0).map((c) => ({ category: c.category, percent: c.percent })),
        save: true,
        name,
      });
      setSaved(true);
      showToast({ tone: "positive", title: "Scenario saved", description: name || undefined });
      onSaved();
    } catch (err) {
      const error = asApiError(err);
      // A rejected name belongs under the input; anything else is an action failure.
      const field = error.field("name");
      if (field) setNameError(field);
      else toastApiError(error, { title: "Scenario not saved", onRetry: () => void save() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-wrap items-start gap-2" onSubmit={save}>
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="scenario-name" className="text-[12.5px] text-t3">
          Name this scenario
        </label>
        <input
          id="scenario-name"
          value={name}
          maxLength={60}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "scenario-name-error" : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          placeholder={`Plan for ${formatMonth(scenario.range.start.slice(0, 7))}`}
          className={`mt-1 h-9 w-full rounded-xl border bg-panel px-3 text-[13px] ${nameError ? "border-destructive" : "border-line-strong"}`}
        />
        <FieldError id="scenario-name-error">{nameError}</FieldError>
      </div>
      <Button type="submit" variant="outline" disabled={busy} className="mt-[22px]">
        {busy && <Spinner />}
        {busy ? "Saving…" : "Save scenario"}
      </Button>
    </form>
  );
}
