// Fixture mode backend. Stands in for the FastAPI service so the demo runs
// when the API is down or not configured (frontend PRD §6).
//
// This file plays the server's role, so it is the one place in web/ that
// does arithmetic on money. UI components must never import from here
// except through lib/api.ts.

import { CATEGORIES, UNCATEGORISED } from "@/configs/categories";
import type {
  Analysis,
  CategoryTotal,
  Comparison,
  DateRange,
  Explanation,
  Forecast,
  ImportPreview,
  ImportRecord,
  Me,
  Order,
  OrderStatus,
  Page,
  ReconciliationCandidate,
  RecurringCandidate,
  ReviewState,
  RowError,
  Scenario,
  ScenarioRequest,
  Transaction,
} from "@/types/api";

export class MockHttpError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : `HTTP ${status}`);
  }
}

const fail = (status: number, detail: unknown): never => {
  throw new MockHttpError(status, detail);
};

// ---------- Storage ----------

type Db = {
  imports: ImportRecord[];
  txns: Transaction[];
  protections: string[];
  scenarios: Scenario[];
  orders: Order[];
  decisions: Record<string, "same" | "different">;
  idempotency: Record<string, string>; // key -> import or order id
  plan: { pro_expires_at: string | null };
  seq: number;
};

const DB_KEY = "spendlens:fixture-db:v1";
const PRO_PRICE_KOBO = 250_000;
const PRO_DAYS = 30;

const emptyDb = (): Db => ({
  imports: [],
  txns: [],
  protections: ["Rent", "Utilities"],
  scenarios: [],
  orders: [],
  decisions: {},
  idempotency: {},
  plan: { pro_expires_at: null },
  seq: 1,
});

let memoryDb: Db | null = null;

function load(): Db {
  if (memoryDb) return memoryDb;
  try {
    const raw = localStorage.getItem(DB_KEY);
    memoryDb = raw ? { ...emptyDb(), ...JSON.parse(raw) } : emptyDb();
  } catch {
    memoryDb = emptyDb();
  }
  // Rows stored before transactions carried a bank get one from their account.
  for (const t of memoryDb!.txns) t.bank ??= bankFor(t.account);
  return memoryDb!;
}

function save(db: Db) {
  memoryDb = db;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Private window or storage full: keep working from memory.
  }
}

const nextId = (db: Db, prefix: string) => `${prefix}_${String(db.seq++).padStart(4, "0")}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Dates ----------

const DAY = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const fromDay = (t: number) => new Date(t).toISOString().slice(0, 10);
const monthOf = (iso: string) => iso.slice(0, 7);

function monthRange(month: string): DateRange {
  const [y, m] = month.split("-").map(Number);
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { start: `${month}-01`, end };
}

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

const inRange = (t: Transaction, r: DateRange) => t.date >= r.start && t.date <= r.end;

// ---------- Banks ----------

// The sample statement's two accounts, so the demo always shows the same banks.
const SAMPLE_ACCOUNT_BANKS: Record<string, string> = {
  "Current account 4821": "guaranty-trust-bank",
  "Debit card 0937": "zenith-bank",
};
const FALLBACK_BANKS = [
  "guaranty-trust-bank",
  "zenith-bank",
  "access-bank",
  "united-bank-for-africa",
  "first-bank-of-nigeria",
  "kuda-bank",
  "paycom",
  "moniepoint-mfb-ng",
];

/** A file without a bank column: pick one per account, the same every time. */
function bankFor(account: string): string {
  if (SAMPLE_ACCOUNT_BANKS[account]) return SAMPLE_ACCOUNT_BANKS[account];
  let h = 0;
  for (const ch of account) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_BANKS[h % FALLBACK_BANKS.length];
}

// ---------- CSV ----------

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

type ParsedRow = Omit<Transaction, "id" | "review_state" | "import_id">;

function parseCsv(text: string): { rows: ParsedRow[]; errors: RowError[]; total: number } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const header = splitCsvLine(lines[0] ?? "").map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const required = ["date", "description", "amount_kobo"];
  const missing = required.filter((h) => col(h) < 0);
  if (missing.length) {
    return {
      rows: [],
      total: 0,
      errors: [{ line: 1, message: `Header is missing: ${missing.join(", ")}. Expected date, description, amount_kobo, direction, account.` }],
    };
  }

  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];
  let total = 0;
  lines.slice(1).forEach((raw, i) => {
    const line = i + 2;
    if (!raw.trim()) return;
    total++;
    const cells = splitCsvLine(raw);
    const get = (name: string) => (col(name) >= 0 ? (cells[col(name)] ?? "") : "");

    const date = get("date");
    const description = get("description");
    const amountRaw = get("amount_kobo");
    const direction = (get("direction") || "debit").toLowerCase();
    const account = get("account") || "Imported account";
    const bank = get("bank") || bankFor(account);
    const category = get("category") || null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(toDay(date)))
      return void errors.push({ line, message: `Date "${date}" is not in YYYY-MM-DD form.` });
    if (!description) return void errors.push({ line, message: "Description is empty." });
    if (!/^\d+$/.test(amountRaw))
      return void errors.push({ line, message: `Amount "${amountRaw}" must be a whole number of kobo, with no sign or decimals.` });
    if (direction !== "debit" && direction !== "credit")
      return void errors.push({ line, message: `Direction "${direction}" must be debit or credit.` });

    rows.push({
      date,
      description,
      amount_kobo: Number(amountRaw),
      direction,
      account,
      bank,
      category: category ?? categorise(description, direction),
    });
  });
  return { rows, errors, total };
}

const RULES: [RegExp, string][] = [
  [/RENT|PROPERTIES/, "Rent"],
  [/FRESHMART|GREENBASKET|MARKET/, "Food and groceries"],
  [/CHOWHUB|KITCHEN|SUYA|CAFE/, "Eating out"],
  [/RIDEGO|BRT|DANFO/, "Transport"],
  [/POWERGRID|WATER/, "Utilities"],
  [/STREAMCO|GYMHUB|CLOUDBOX/, "Subscriptions"],
  [/AIRTIME|DATA BUNDLE/, "Data and airtime"],
  [/PHARMACY|CLINIC/, "Health"],
  [/STYLEHAUS|GADGETBAY|BOOKNOOK/, "Shopping"],
];

function categorise(description: string, direction: string): string | null {
  if (direction === "credit") return "Income";
  const d = description.toUpperCase();
  return RULES.find(([re]) => re.test(d))?.[1] ?? null;
}

// ---------- Derived data ----------

function coverageWarnings(dates: string[], range: DateRange | null): string[] {
  if (!range) return [];
  const have = new Set(dates);
  const warnings: string[] = [];
  let runStart: number | null = null;
  for (let t = toDay(range.start); t <= toDay(range.end) + DAY; t += DAY) {
    const missing = t <= toDay(range.end) && !have.has(fromDay(t));
    if (missing && runStart === null) runStart = t;
    if (!missing && runStart !== null) {
      const days = Math.round((t - runStart) / DAY);
      if (days >= 7)
        warnings.push(`No transactions for ${days} days in this range (${fromDay(runStart)} to ${fromDay(t - DAY)}).`);
      runStart = null;
    }
  }
  return warnings;
}

function dataRange(txns: Transaction[]): DateRange | null {
  if (!txns.length) return null;
  const dates = txns.map((t) => t.date).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

const active = (db: Db) => db.txns.filter((t) => t.review_state !== "duplicate");
const spend = (db: Db) => active(db).filter((t) => t.direction === "debit");

function candidates(db: Db): ReconciliationCandidate[] {
  const debits = spend(db);
  const out: ReconciliationCandidate[] = [];
  for (let i = 0; i < debits.length; i++) {
    for (let j = i + 1; j < debits.length; j++) {
      const a = debits[i];
      const b = debits[j];
      if (a.amount_kobo !== b.amount_kobo || a.account === b.account) continue;
      const gap = Math.abs(toDay(a.date) - toDay(b.date)) / DAY;
      if (gap > 1) continue;
      const id = `rc_${a.id}_${b.id}`;
      if (db.decisions[id]) continue;
      out.push({
        id,
        a,
        b,
        reason:
          gap === 0
            ? "Same amount on the same day from two accounts."
            : "Same amount one day apart from two accounts.",
      });
    }
  }
  return out;
}

function totalsByCategory(txns: Transaction[], protections: string[]): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of txns) {
    const key = t.category ?? UNCATEGORISED;
    const cur = map.get(key) ?? { total: 0, count: 0 };
    cur.total += t.amount_kobo;
    cur.count++;
    map.set(key, cur);
  }
  const sum = [...map.values()].reduce((s, v) => s + v.total, 0);
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      total_kobo: v.total,
      share_pct: sum ? Math.round((v.total * 1000) / sum) / 10 : 0,
      txn_count: v.count,
      protected: protections.includes(category),
    }))
    .sort((a, b) => b.total_kobo - a.total_kobo);
}

function isPro(db: Db) {
  return Boolean(db.plan.pro_expires_at && Date.parse(db.plan.pro_expires_at) > Date.now());
}

function defaultRange(db: Db): DateRange | null {
  const r = dataRange(db.txns);
  return r ? monthRange(monthOf(r.end)) : null;
}

function availableMonths(db: Db): string[] {
  return [...new Set(db.txns.map((t) => monthOf(t.date)))].sort().reverse();
}

function monthlyTotals(db: Db) {
  const months = availableMonths(db).slice().reverse();
  const totals = months.map((m) => spend(db).filter((t) => monthOf(t.date) === m).reduce((s, t) => s + t.amount_kobo, 0));
  const max = Math.max(0, ...totals);
  return months.map((month, i) => ({
    month,
    total_kobo: totals[i],
    pct_of_max: max ? Math.round((totals[i] * 1000) / max) / 10 : 0,
  }));
}

function comparison(db: Db, range: DateRange): Comparison {
  const prevMonth = shiftMonth(monthOf(range.start), -1);
  const prevRange = monthRange(prevMonth);
  const now = totalsByCategory(spend(db).filter((t) => inRange(t, range)), db.protections);
  const before = totalsByCategory(spend(db).filter((t) => inRange(t, prevRange)), db.protections);
  const names = [...new Set([...now, ...before].map((c) => c.category))];
  const categories = names
    .map((category) => {
      const current = now.find((c) => c.category === category)?.total_kobo ?? 0;
      const previous = before.find((c) => c.category === category)?.total_kobo ?? 0;
      return {
        category,
        current_kobo: current,
        previous_kobo: previous,
        change_kobo: current - previous,
        change_pct: previous ? Math.round(((current - previous) * 100) / previous) : null,
      };
    })
    .sort((a, b) => Math.abs(b.change_kobo) - Math.abs(a.change_kobo));
  const prevTotal = before.reduce((s, c) => s + c.total_kobo, 0);
  const nowTotal = now.reduce((s, c) => s + c.total_kobo, 0);
  return { previous_range: prevRange, previous_total_kobo: prevTotal, change_kobo: nowTotal - prevTotal, categories };
}

function analysis(db: Db, q: Record<string, unknown>): Analysis {
  const range =
    typeof q.start === "string" && typeof q.end === "string"
      ? { start: q.start, end: q.end }
      : defaultRange(db);
  const dr = dataRange(db.txns);
  const base = {
    data_range: dr,
    available_months: availableMonths(db),
    monthly_totals: monthlyTotals(db),
    needs_review_count: active(db).filter((t) => t.review_state === "needs_review").length,
    reconciliation_candidates: candidates(db),
    imports: db.imports,
  };
  if (!range) {
    return {
      ...base,
      range: { start: "", end: "" },
      total_spent_kobo: 0,
      total_income_kobo: 0,
      txn_count: 0,
      categories: [],
      coverage: { days_with_data: 0, days_in_range: 0 },
      coverage_warnings: [],
      comparison: null,
    };
  }
  if (q.compare === "previous" && !isPro(db)) fail(402, "pro_required");

  const inR = active(db).filter((t) => inRange(t, range));
  const debits = inR.filter((t) => t.direction === "debit");
  // Coverage is judged only on the part of the range the imports span.
  const covered =
    dr && { start: range.start > dr.start ? range.start : dr.start, end: range.end < dr.end ? range.end : dr.end };
  const daysInRange = Math.round((toDay(range.end) - toDay(range.start)) / DAY) + 1;
  const warnings = covered && covered.start <= covered.end ? coverageWarnings(inR.map((t) => t.date), covered) : [];
  const dupCount = candidates(db).filter((c) => inRange(c.a, range) || inRange(c.b, range)).length;
  if (dupCount)
    warnings.push(`${dupCount} possible duplicate${dupCount > 1 ? "s" : ""} may be counted twice until reviewed.`);

  return {
    ...base,
    range,
    total_spent_kobo: debits.reduce((s, t) => s + t.amount_kobo, 0),
    total_income_kobo: inR.filter((t) => t.direction === "credit").reduce((s, t) => s + t.amount_kobo, 0),
    txn_count: inR.length,
    categories: totalsByCategory(debits, db.protections),
    coverage: { days_with_data: new Set(inR.map((t) => t.date)).size, days_in_range: daysInRange },
    coverage_warnings: warnings,
    comparison: q.compare === "previous" ? comparison(db, range) : null,
  };
}

function scenario(db: Db, req: ScenarioRequest): Scenario {
  if (!req?.range?.start || !req?.range?.end) fail(422, "A date range is required.");
  if (req.save && !isPro(db)) fail(402, "pro_required");
  const cuts = new Map<string, number>();
  for (const c of req.cuts ?? []) {
    if (!Number.isInteger(c.percent) || c.percent < 0 || c.percent > 100)
      fail(422, `Cut for ${c.category} must be a whole number from 0 to 100.`);
    if (c.percent > 0 && db.protections.includes(c.category))
      fail(422, `${c.category} is protected, so it cannot be cut.`);
    cuts.set(c.category, c.percent);
  }
  const debits = spend(db).filter((t) => inRange(t, req.range));
  const totals = totalsByCategory(debits, db.protections);
  const categories = totals.map((c) => {
    const percent = cuts.get(c.category) ?? 0;
    return {
      category: c.category,
      total_kobo: c.total_kobo,
      percent,
      reduction_kobo: Math.floor((c.total_kobo * percent) / 100),
    };
  });
  const baseline = totals.reduce((s, c) => s + c.total_kobo, 0);
  const reduction = categories.reduce((s, c) => s + c.reduction_kobo, 0);
  const cutNames = new Set(categories.filter((c) => c.percent > 0).map((c) => c.category));
  const a = analysis(db, req.range);
  const result: Scenario = {
    id: nextId(db, "scn"),
    data_revision: `rev_fixture_${db.txns.length}_${Object.keys(db.decisions).length}`,
    range: req.range,
    baseline_kobo: baseline,
    categories,
    total_reduction_kobo: reduction,
    remaining_kobo: baseline - reduction,
    protected_categories: [...db.protections],
    coverage_warnings: a.coverage_warnings,
    evidence_txn_ids: debits.filter((t) => cutNames.has(t.category ?? UNCATEGORISED)).map((t) => t.id),
    saved: Boolean(req.save),
    name: req.save ? req.name?.trim() || `Plan for ${req.range.start.slice(0, 7)}` : null,
    created_at: new Date().toISOString(),
  };
  db.scenarios = [result, ...db.scenarios].slice(0, 30);
  save(db);
  return result;
}

const naira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

/** Same wording as ai/explain.py template_explanation. */
function explanation(s: Scenario): Explanation {
  const cuts = s.categories.filter((c) => c.percent > 0);
  let text: string;
  if (cuts.length) {
    const parts = cuts.map((c) => `${c.category} ${c.percent}% (saves ${naira(c.reduction_kobo)})`);
    text = `Cuts: ${parts.join(", ")}. Total saving: ${naira(s.total_reduction_kobo)}. Remaining: ${naira(s.remaining_kobo)}.`;
  } else {
    text = `No cuts are selected, so spending stays at ${naira(s.baseline_kobo)}.`;
  }
  if (s.protected_categories.length) text += ` Protected: ${s.protected_categories.join(", ")}.`;
  if (s.coverage_warnings.length)
    text += ` Note: ${s.coverage_warnings.map((w) => w.replace(/\.$/, "")).join("; ")}.`;
  return {
    text,
    numbers_used: [s.baseline_kobo, s.total_reduction_kobo, s.remaining_kobo, ...cuts.map((c) => c.reduction_kobo)],
    source: "template",
  };
}

function forecast(db: Db): Forecast {
  if (!isPro(db)) fail(402, "pro_required");
  const months = availableMonths(db).slice(0, 3);
  const latest = months[0];
  const target = latest ? shiftMonth(latest, 1) : "";
  const debits = spend(db);
  const cats = [...new Set(debits.map((t) => t.category ?? UNCATEGORISED))];
  const rows = cats.map((category) => {
    const perMonth = months.map((m) =>
      debits
        .filter((t) => (t.category ?? UNCATEGORISED) === category && monthOf(t.date) === m)
        .reduce((s, t) => s + t.amount_kobo, 0),
    );
    const withData = perMonth.filter((v) => v > 0).length;
    if (withData < 3) {
      return {
        category,
        point_kobo: null,
        low_kobo: null,
        high_kobo: null,
        method: "Median of the last 3 months",
        months_of_data: withData,
        abstained: true,
        reason: `Only ${withData} month${withData === 1 ? "" : "s"} with spending here. A forecast needs 3.`,
      };
    }
    const sorted = [...perMonth].sort((a, b) => a - b);
    return {
      category,
      point_kobo: sorted[1],
      low_kobo: sorted[0],
      high_kobo: sorted[2],
      method: "Median of the last 3 months; range is the lowest to highest month",
      months_of_data: withData,
      abstained: false,
      reason: null,
    };
  });
  rows.sort((a, b) => Number(a.abstained) - Number(b.abstained) || (b.point_kobo ?? 0) - (a.point_kobo ?? 0));
  return { month: target, categories: rows };
}

/** Port of ai/recurring.py find_recurring. */
function recurring(db: Db): RecurringCandidate[] {
  const PERIODS: [number, number][] = [
    [7, 1],
    [14, 2],
    [30, 3],
  ];
  const key = (d: string) =>
    d.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
  const groups = new Map<string, { merchant: string; amount: number; days: Set<string>; txns: Transaction[] }>();
  for (const t of spend(db)) {
    const k = `${key(t.description)}|${t.amount_kobo}`;
    const g = groups.get(k) ?? { merchant: key(t.description), amount: t.amount_kobo, days: new Set(), txns: [] };
    g.days.add(t.date);
    g.txns.push(t);
    groups.set(k, g);
  }
  const found: RecurringCandidate[] = [];
  for (const g of groups.values()) {
    const days = [...g.days].sort();
    if (!g.merchant || days.length < 3) continue;
    const gaps = days.slice(1).map((d, i) => (toDay(d) - toDay(days[i])) / DAY);
    const mid = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    for (const [period, tol] of PERIODS) {
      if (Math.abs(mid - period) <= tol && gaps.every((x) => Math.abs(x - period) <= tol)) {
        found.push({
          merchant_key: g.merchant,
          amount_kobo: g.amount,
          period_days: period,
          next_due: fromDay(toDay(days[days.length - 1]) + period * DAY),
          occurrences: days.length,
          confidence: Math.min(0.95, 0.5 + 0.1 * days.length),
          category: g.txns[0].category,
          txn_ids: g.txns.map((t) => t.id),
        });
        break;
      }
    }
  }
  return found.sort((a, b) => b.confidence - a.confidence || a.merchant_key.localeCompare(b.merchant_key));
}

function me(db: Db): Me {
  return {
    plan: isPro(db) ? "pro" : "free",
    pro_expires_at: isPro(db) ? db.plan.pro_expires_at : null,
    pro_price_kobo: PRO_PRICE_KOBO,
    pro_days: PRO_DAYS,
  };
}

// ---------- Transactions ----------

function listTransactions(db: Db, q: Record<string, unknown>): Page<Transaction> {
  const page = Math.max(1, Number(q.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q.page_size) || 25));
  const ids = typeof q.ids === "string" ? new Set(q.ids.split(",")) : Array.isArray(q.ids) ? new Set(q.ids as string[]) : null;
  const text = typeof q.q === "string" ? q.q.toLowerCase() : "";
  let items = db.txns.filter((t) => {
    if (ids && !ids.has(t.id)) return false;
    if (q.category) {
      const cat = t.category ?? UNCATEGORISED;
      if (cat !== q.category) return false;
    }
    if (q.review_state && t.review_state !== q.review_state) return false;
    if (typeof q.start === "string" && t.date < q.start) return false;
    if (typeof q.end === "string" && t.date > q.end) return false;
    if (text && !t.description.toLowerCase().includes(text)) return false;
    return true;
  });
  items = items.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, page_size: pageSize };
}

// ---------- Router ----------

type Req = {
  query?: Record<string, unknown>;
  body?: unknown;
  form?: FormData;
  idempotencyKey?: string;
};

async function readCsv(form?: FormData): Promise<{ name: string; text: string }> {
  const file = form?.get("file");
  if (!(file instanceof Blob)) fail(422, "Attach a CSV file.");
  const f = file as File;
  return { name: f.name || "upload.csv", text: await f.text() };
}

export async function handle(method: string, path: string, req: Req): Promise<unknown> {
  await sleep(180 + Math.random() * 220); // feel like a network call
  const db = load();
  const q = req.query ?? {};
  const body = (req.body ?? {}) as Record<string, unknown>;
  const route = `${method} ${path}`;
  let m: RegExpMatchArray | null;

  if (route === "GET /health") return { status: "ok", database: "ok" };

  if (route === "POST /v1/imports/preview") {
    const { name, text } = await readCsv(req.form);
    const { rows, errors, total } = parseCsv(text);
    const dr = rows.length ? dataRange(rows as Transaction[]) : null;
    const preview: ImportPreview = {
      filename: name,
      row_count: total,
      valid_count: rows.length,
      date_range: dr,
      accounts: [...new Set(rows.map((r) => r.account))],
      errors,
      sample_rows: rows.slice(0, 6),
      coverage_warnings: coverageWarnings(rows.map((r) => r.date), dr),
    };
    return preview;
  }

  if (route === "POST /v1/imports") {
    const key = req.idempotencyKey;
    if (!key) fail(400, "Idempotency-Key header is required.");
    const existing = db.idempotency[key!];
    if (existing) return db.imports.find((i) => i.id === existing);
    const { name, text } = await readCsv(req.form);
    const { rows, errors } = parseCsv(text);
    if (!rows.length) fail(422, errors[0]?.message ?? "The file has no usable rows.");
    const id = nextId(db, "imp");
    const txns: Transaction[] = rows.map((r) => ({
      ...r,
      id: nextId(db, "t"),
      import_id: id,
      review_state: (r.category ? "ok" : "needs_review") as ReviewState,
    }));
    const dr = dataRange(txns);
    const record: ImportRecord = {
      id,
      filename: name,
      row_count: txns.length,
      date_range: dr,
      created_at: new Date().toISOString(),
      coverage_warnings: coverageWarnings(txns.map((t) => t.date), dr),
    };
    db.imports.push(record);
    db.txns.push(...txns);
    db.idempotency[key!] = id;
    save(db);
    return record;
  }

  if (method === "DELETE" && (m = path.match(/^\/v1\/imports\/([^/]+)$/))) {
    const id = decodeURIComponent(m[1]);
    if (!db.imports.some((i) => i.id === id)) fail(404, "Import not found.");
    db.imports = db.imports.filter((i) => i.id !== id);
    db.txns = db.txns.filter((t) => t.import_id !== id);
    db.scenarios = [];
    save(db);
    return undefined;
  }

  if (route === "GET /v1/transactions") return listTransactions(db, q);

  if (method === "PATCH" && (m = path.match(/^\/v1\/transactions\/([^/]+)$/))) {
    const t = db.txns.find((x) => x.id === decodeURIComponent(m![1]));
    if (!t) fail(404, "Transaction not found.");
    const txn = t!;
    if (typeof body.category === "string") {
      if (!(CATEGORIES as readonly string[]).includes(body.category)) fail(422, "Unknown category.");
      txn.category = body.category;
      txn.review_state = "corrected";
    }
    if (typeof body.review_state === "string") txn.review_state = body.review_state as ReviewState;
    save(db);
    return txn;
  }

  if (route === "POST /v1/reconciliation/confirm") {
    const id = String(body.candidate_id ?? "");
    const decision = body.decision;
    if (decision !== "same" && decision !== "different") fail(422, "Decision must be same or different.");
    const c = candidates(db).find((x) => x.id === id);
    if (!c) fail(404, "That candidate was already reviewed.");
    db.decisions[id] = decision as "same" | "different";
    if (decision === "same") {
      const dup = db.txns.find((t) => t.id === c!.b.id);
      if (dup) dup.review_state = "duplicate";
    }
    save(db);
    return { ok: true };
  }

  if (route === "GET /v1/analysis") return analysis(db, q);

  if (route === "PUT /v1/protections") {
    const cats = Array.isArray(body.categories) ? body.categories.filter((c): c is string => typeof c === "string") : [];
    db.protections = [...new Set(cats)];
    save(db);
    return { categories: db.protections };
  }

  if (route === "POST /v1/scenarios") return scenario(db, req.body as ScenarioRequest);
  if (route === "GET /v1/scenarios") {
    if (!isPro(db)) fail(402, "pro_required");
    return db.scenarios.filter((s) => s.saved);
  }

  if (method === "POST" && (m = path.match(/^\/v1\/scenarios\/([^/]+)\/explanation$/))) {
    const s = db.scenarios.find((x) => x.id === decodeURIComponent(m![1]));
    if (!s) fail(404, "Scenario not found.");
    await sleep(900);
    return explanation(s!);
  }

  if (route === "GET /v1/me") return me(db);

  if (route === "POST /v1/billing/orders") {
    const key = req.idempotencyKey;
    if (!key) fail(400, "Idempotency-Key header is required.");
    const existing = db.orders.find((o) => o.id === db.idempotency[key!]);
    if (existing) return existing;
    const id = nextId(db, "ord");
    const order: Order = {
      id,
      reference: `SL-FIXTURE-${id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      amount: PRO_PRICE_KOBO / 100,
      amount_kobo: PRO_PRICE_KOBO,
      amount_paid_kobo: null,
      currency: "NGN",
      notification_url: "https://fixture.invalid/v1/billing/webhook",
      status: "pending",
    };
    db.orders.push(order);
    db.idempotency[key!] = id;
    save(db);
    return order;
  }

  if (method === "GET" && (m = path.match(/^\/v1\/billing\/orders\/([^/]+)$/))) {
    const o = db.orders.find((x) => x.id === decodeURIComponent(m![1]));
    if (!o) fail(404, "Order not found.");
    return o;
  }

  if (route === "GET /v1/forecast") return forecast(db);
  if (route === "GET /v1/recurring") return recurring(db);

  if (route === "DELETE /v1/me/data") {
    const keep = { plan: db.plan, orders: db.orders };
    save({ ...emptyDb(), ...keep });
    return undefined;
  }

  fail(404, `No fixture for ${route}.`);
}

// ---------- Fixture-only helpers (not API endpoints) ----------

export type SandboxOutcome = Exclude<OrderStatus, "pending" | "expired"> | "no_answer";

/**
 * Stands in for Kora's webhook reaching our backend. Only the order record
 * changes here; the page still learns the result by polling the order.
 */
export function simulateWebhook(orderId: string, outcome: SandboxOutcome) {
  const db = load();
  const o = db.orders.find((x) => x.id === orderId);
  if (!o || o.status !== "pending" || outcome === "no_answer") return;
  o.status = outcome;
  if (outcome === "paid") o.amount_paid_kobo = o.amount_kobo;
  if (outcome === "underpaid") o.amount_paid_kobo = Math.floor(o.amount_kobo / 2);
  if (outcome === "overpaid") o.amount_paid_kobo = o.amount_kobo + 50_000;
  if (outcome === "paid" || outcome === "overpaid") {
    db.plan.pro_expires_at = new Date(Date.now() + PRO_DAYS * DAY).toISOString();
  }
  save(db);
}

/** Ends Pro in fixture mode so the paywall can be shown again. */
export function resetFixturePlan() {
  const db = load();
  db.plan.pro_expires_at = null;
  save(db);
}

export function resetFixtureDb() {
  memoryDb = null;
  try {
    localStorage.removeItem(DB_KEY);
  } catch {
    // ignore
  }
}
