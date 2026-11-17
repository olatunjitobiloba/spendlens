"use client";

// The Plan page runs in the browser. The API has no scenario or protection
// routes, so the cut maths works from GET /v1/analysis totals, and protections
// and saved plans live in this browser only.

import { useSyncExternalStore } from "react";

import { STORAGE_PREFIX } from "@/configs/insights";
import type { Analysis, Scenario } from "@/types/api";

// ---------- A small JSON store in localStorage ----------

const EVENT = "spendlens:local-store";

function createStore<T>(key: string, fallback: T) {
  let cachedRaw: string | null | undefined;
  let cached: T = fallback;

  function get(): T {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      // Storage blocked: fall back for this session.
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cached = raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        cached = fallback;
      }
    }
    return cached;
  }

  function set(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked or full: keep working in memory.
      cachedRaw = undefined;
      cached = value;
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  }

  function subscribe(onChange: () => void) {
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }

  /** Server render and first paint see `fallback`, then the stored value. */
  function useValue(): T {
    return useSyncExternalStore(subscribe, get, () => fallback);
  }

  return { get, set, useValue };
}

const NO_STRINGS: string[] = [];
const NO_SCENARIOS: Scenario[] = [];

const protectionsStore = createStore<string[]>(`${STORAGE_PREFIX}protections:v1`, NO_STRINGS);
const savedStore = createStore<Scenario[]>(`${STORAGE_PREFIX}saved-scenarios:v1`, NO_SCENARIOS);

export const useProtections = protectionsStore.useValue;
export const useSavedScenarios = savedStore.useValue;

export function setProtected(category: string, on: boolean) {
  const current = protectionsStore.get();
  protectionsStore.set(on ? [...new Set([...current, category])] : current.filter((c) => c !== category));
}

/** Keeps the 30 most recent saved plans. */
export function saveScenario(scenario: Scenario, name: string) {
  const saved: Scenario = { ...scenario, saved: true, name };
  savedStore.set([saved, ...savedStore.get().filter((s) => s.id !== scenario.id)].slice(0, 30));
}

// ---------- Maths ----------

/** The analysis with this browser's protections applied to its categories. */
export function withProtections(analysis: Analysis, protections: string[]): Analysis {
  return {
    ...analysis,
    categories: analysis.categories.map((c) => ({ ...c, protected: protections.includes(c.category) })),
  };
}

/**
 * A cut scenario from the month's category totals. Whole-kobo maths, rounded
 * down per category so the saving is never overstated. Protected categories
 * are never cut.
 */
export function buildScenario(analysis: Analysis, protections: string[], cuts: Record<string, number>): Scenario {
  const categories = analysis.categories.map((c) => {
    const percent = protections.includes(c.category) ? 0 : Math.min(100, Math.max(0, Math.round(cuts[c.category] ?? 0)));
    return {
      category: c.category,
      total_kobo: c.total_kobo,
      percent,
      reduction_kobo: Math.floor((c.total_kobo * percent) / 100),
    };
  });
  const baseline = categories.reduce((s, c) => s + c.total_kobo, 0);
  const reduction = categories.reduce((s, c) => s + c.reduction_kobo, 0);
  return {
    id: crypto.randomUUID(),
    data_revision: `${analysis.range.start}|${analysis.txn_count}|${analysis.total_spent_kobo}`,
    range: analysis.range,
    baseline_kobo: baseline,
    categories,
    total_reduction_kobo: reduction,
    remaining_kobo: baseline - reduction,
    protected_categories: analysis.categories.filter((c) => protections.includes(c.category)).map((c) => c.category),
    coverage_warnings: analysis.coverage_warnings,
    evidence_txn_ids: [],
    saved: false,
    name: null,
    created_at: new Date().toISOString(),
  };
}

const naira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

/** The result in one paragraph, written from the numbers. Same wording as ai/explain.py's template. */
export function describeScenario(s: Scenario): string {
  const cuts = s.categories.filter((c) => c.percent > 0);
  let text = cuts.length
    ? `Cuts: ${cuts.map((c) => `${c.category} ${c.percent}% (saves ${naira(c.reduction_kobo)})`).join(", ")}. ` +
      `Total saving: ${naira(s.total_reduction_kobo)}. Remaining: ${naira(s.remaining_kobo)}.`
    : `No cuts are selected, so spending stays at ${naira(s.baseline_kobo)}.`;
  if (s.protected_categories.length) text += ` Protected: ${s.protected_categories.join(", ")}.`;
  if (s.coverage_warnings.length) text += ` Note: ${s.coverage_warnings.map((w) => w.replace(/\.$/, "")).join("; ")}.`;
  return text;
}
