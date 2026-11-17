"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Notice } from "@/components/ui/notice";
import { showToast } from "@/components/ui/toast";
import { saveScenario } from "@/lib/plan";
import type { Scenario } from "@/types/api";
import { formatMonth } from "@/utils/format";

/** Saves the scenario in this browser. The API has no scenario routes. */
export function SaveScenario({ scenario }: { scenario: Scenario }) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fallbackName = `Plan for ${formatMonth(scenario.range.start.slice(0, 7))}`;

  if (saved) return <Notice tone="positive" title="Scenario saved" />;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (name && !clean) {
      setNameError("Use letters or numbers, not just spaces.");
      return;
    }
    saveScenario(scenario, clean || fallbackName);
    setSaved(true);
    showToast({ tone: "positive", title: "Scenario saved", description: clean || fallbackName });
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
          placeholder={fallbackName}
          className={`mt-1 h-9 w-full rounded-xl border bg-panel px-3 text-[13px] ${nameError ? "border-destructive" : "border-line-strong"}`}
        />
        <FieldError id="scenario-name-error">{nameError}</FieldError>
      </div>
      <Button type="submit" variant="outline" className="mt-[22px]">
        Save scenario
      </Button>
    </form>
  );
}
