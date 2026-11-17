// Fixture mode backend. Stands in for the FastAPI service so the demo runs
// when the API is down or not configured (frontend PRD §6).
//
// This file plays the server's role, so it is the one place in web/ that
// does arithmetic on money. UI components must never import from here
// except through lib/api.ts.

import { findBank } from "@/configs/banks";
import { CATEGORIES, UNCATEGORISED } from "@/configs/categories";
import type {
  Analysis,
  CategoryTotal,
  ChatReply,
  Comparison,
  DateRange,
  HabitAudit,
  ImportPreview,
  ImportRecord,
  InvestmentOption,
  InvestmentProjection,
  Page,
  ReconciliationCandidate,
  RecurringCandidate,
  ReviewState,
  RowError,
  SubscriptionItem,
  Transaction,
  Transcription,
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
  decisions: Record<string, "same" | "different">;
  idempotency: Record<string, string>; // key -> import id
  seq: number;
};

const DB_KEY = "spendlens:fixture-db:v1";

const emptyDb = (): Db => ({
  imports: [],
  txns: [],
  // Protections live in the browser now (lib/plan.ts); the API has no route for them.
  protections: [],
  decisions: {},
  idempotency: {},
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
  "OPay wallet 7710": "paycom",
  "Moniepoint account 3306": "moniepoint-mfb-ng",
  "Savings account 5194": "access-bank",
  "Kuda account 2268": "kuda-bank",
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
  // The API's columns: amount in naira and account_alias. amount_kobo and account
  // are still read so older sample files keep working.
  const inKobo = col("amount") < 0 && col("amount_kobo") >= 0;
  const required = ["date", "description", inKobo ? "amount_kobo" : "amount"];
  const missing = required.filter((h) => col(h) < 0);
  if (missing.length) {
    return {
      rows: [],
      total: 0,
      errors: [{ line: 1, message: `Header is missing: ${missing.join(", ")}. Expected date, description, amount, direction, bank.` }],
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
    const amountRaw = get(inKobo ? "amount_kobo" : "amount");
    const direction = (get("direction") || "debit").toLowerCase();
    const account = get("account_alias") || get("account") || "Primary";
    const bank = get("bank") || bankFor(account);
    const category = get("category") || null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(toDay(date)))
      return void errors.push({ line, message: `Date "${date}" is not in YYYY-MM-DD form.` });
    if (!description) return void errors.push({ line, message: "Description is empty." });
    const amountOk = inKobo ? /^\d+$/.test(amountRaw) : /^\d+(\.\d{1,2})?$/.test(amountRaw) && Number(amountRaw) > 0;
    if (!amountOk)
      return void errors.push({ line, message: `Amount "${amountRaw}" must be a positive number like 1500.00, with no sign.` });
    if (direction !== "debit" && direction !== "credit")
      return void errors.push({ line, message: `Direction "${direction}" must be debit or credit.` });

    rows.push({
      date,
      description,
      amount_kobo: inKobo ? Number(amountRaw) : Math.round(Number(amountRaw) * 100),
      direction,
      account,
      bank,
      category: category ?? categorise(description, direction),
    });
  });
  return { rows, errors, total };
}

// First match wins, so specific merchants sit above broad words like MARKET or TRF.
// Covers the generated sample (lib/sample.ts) and common wording on real
// Nigerian bank exports (GTBank, Zenith, Access, UBA, OPay, Kuda, Moniepoint).
const RULES: [RegExp, string][] = [
  [/\bRENT\b|PROPERTIES|LANDLORD|SERVICE CHARGE/, "Rent"],
  [/STREAMCO|GYMHUB|CLOUDBOX|SPOTIFY|NETFLIX|SHOWMAX|DSTV|GOTV|STARTIMES|APPLE\.COM|GOOGLE ?PLAY|YOUTUBE|ICLOUD|PRIME VIDEO|SUBSCRIPTION/, "Subscriptions"],
  [/AIRTIME|DATA BUNDLE|\bVTU\b|\bMTN\b|\bGLO\b|AIRTEL|9MOBILE/, "Data and airtime"],
  [/POWERGRID|ELECTRICITY|IKEDC|EKEDC|AEDC|PHED|IBEDC|KEDCO|PREPAID TOKEN|WATER BOARD|\bLAWMA\b|WASTE/, "Utilities"],
  [/PHARMACY|CLINIC|HOSPITAL|MEDICAL|\bLAB\b|HMO|MEDIPLUS|HEALTHPLUS/, "Health"],
  [/TUITION|SCHOOL|UNIVERSITY|\bWAEC\b|\bJAMB\b|COURSE|UDEMY/, "Education"],
  [/RIDEGO|\bBRT\b|DANFO|BUS FARE|TRANSPORT|BOLT|UBER|INDRIVE|\bTAXI\b|FUEL|PETROL|FILLING STATION|TOTALENERGIES|\bNNPC\b|\bMRS\b|\bOANDO\b|\bLCC\b|TOLL/, "Transport"],
  [/CHOWHUB|KITCHEN|SUYA|CAFE|RESTAURANT|EATERY|CHICKEN REPUBLIC|\bKFC\b|DOMINO|MR BIGGS|TANTALIZERS|SWEET SENSATION|COLD STONE|GLOVO|CHOWDECK|RICE AND STEW|BUKA/, "Eating out"],
  [/FRESHMART|GREENBASKET|SHOPRITE|SPAR\b|JUSTRITE|PRINCE EBEANO|MARKET|SUPERMARKET|GROCER|FOOD STORE|FOOD ITEMS/, "Food and groceries"],
  [/STYLEHAUS|GADGETBAY|BOOKNOOK|JUMIA|KONGA|SLOT\b|CLOTHING|FASHION|BOUTIQUE|CINEMA|FILMHOUSE|GENESIS/, "Shopping"],
  [/PIGGYVEST|COWRYWISE|RISEVEST|SAVINGS|TRANSFER TO|\bTRF\b|\bTRANSFER\b|NIP\/|\bNIP\b|\bFIP\b|WALLET/, "Transfers"],
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

function defaultRange(db: Db): DateRange | null {
  const r = dataRange(db.txns);
  return r ? monthRange(monthOf(r.end)) : null;
}

/** A transaction's bank as a slug when known, so filters match any spelling. */
const bankKey = (t: Transaction) => (t.bank ? (findBank(t.bank)?.slug ?? t.bank) : "");

function availableBanks(db: Db): string[] {
  return [...new Set(db.txns.map(bankKey).filter(Boolean))].sort();
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
    available_banks: availableBanks(db),
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

const naira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

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
    if (typeof q.bank === "string" && q.bank && bankKey(t) !== (findBank(q.bank)?.slug ?? q.bank)) return false;
    if (typeof q.start === "string" && t.date < q.start) return false;
    if (typeof q.end === "string" && t.date > q.end) return false;
    if (text && !t.description.toLowerCase().includes(text)) return false;
    return true;
  });
  items = items.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, page_size: pageSize };
}

// ---------- Chat ----------

/** Same wording as ai/chat.py REFUSAL. */
const CHAT_REFUSAL = "I can't answer that reliably. Try asking about your totals, categories or planned savings.";

/**
 * A rule-based stand-in for ai/chat.py: it answers the same few questions from
 * the same figures the tools expose, so the demo stays grounded offline.
 */
function chatReply(db: Db, message: string): ChatReply {
  const reply = (answer: string, source: ChatReply["source"] = "model"): ChatReply => ({
    answer,
    source,
    tool_calls: source === "model" ? 1 : 0,
  });
  const a = analysis(db, {});
  if (!a.txn_count) {
    return reply("There are no transactions to look at yet. Import a statement and ask me again.", "refusal");
  }
  const q = message.toLowerCase();
  const period = formatPeriod(a.range.start);
  const cat = a.categories.find((c) => q.includes(c.category.toLowerCase()));

  if (cat) {
    const guard = cat.protected ? " It is protected, so plans will not cut it." : "";
    return reply(
      `You spent ${naira(cat.total_kobo)} on ${cat.category} in ${period}, across ${cat.txn_count} transaction${cat.txn_count === 1 ? "" : "s"}. That is ${cat.share_pct}% of your spending.${guard}`,
    );
  }
  if (/protect|essential/.test(q)) {
    const list = a.categories.filter((c) => c.protected).map((c) => c.category);
    return reply(
      list.length
        ? `Protected categories: ${list.join(", ")}. Savings plans leave these untouched.`
        : "Nothing is protected yet. You can mark essentials like Rent on the Plan page.",
    );
  }
  if (/most|top|biggest|largest|where/.test(q)) {
    const top = a.categories.slice(0, 3).map((c) => `${c.category} (${naira(c.total_kobo)})`);
    return reply(`Most of your money in ${period} went to ${top.join(", ")}.`);
  }
  if (/income|earn|salary|receiv|credit/.test(q)) {
    return reply(`Money in for ${period} came to ${naira(a.total_income_kobo)}.`);
  }
  if (/left|remain|save|saving/.test(q)) {
    const left = a.total_income_kobo - a.total_spent_kobo;
    return reply(
      left >= 0
        ? `In ${period} you brought in ${naira(a.total_income_kobo)} and spent ${naira(a.total_spent_kobo)}, leaving ${naira(left)}.`
        : `In ${period} you spent ${naira(-left)} more than came in.`,
    );
  }
  if (/spen|total|cost|how much/.test(q)) {
    return reply(`You spent ${naira(a.total_spent_kobo)} in ${period} across ${a.txn_count} transactions.`);
  }
  return reply(CHAT_REFUSAL, "refusal");
}

function formatPeriod(start: string) {
  return new Date(`${start.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Fixture mode cannot run speech-to-text, so a voice note becomes one of these questions. */
const SAMPLE_TRANSCRIPTS = [
  "How much did I spend this month?",
  "Where did most of my money go?",
  "How much money came in this month?",
  "Which categories are protected?",
];

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
  if (f.name.toLowerCase().endsWith(".pdf")) {
    fail(415, "Sample mode reads CSV files only. Switch the data source to Live API in the sidebar to import a PDF.");
  }
  return { name: f.name || "upload.csv", text: await f.text() };
}

// ---------- Habits, subscriptions, investments ----------

/** Port of ai/habits.py analyze_habits. Rows carry no time here, so nothing counts as late-night. */
function habits(db: Db): HabitAudit {
  const debits = spend(db).filter((t) => t.amount_kobo > 0);
  let total = 0;
  let weekendKobo = 0;
  let weekendCount = 0;
  let microCount = 0;
  let microKobo = 0;
  for (const t of debits) {
    total += t.amount_kobo;
    if (t.amount_kobo <= 250_000) {
      microCount++;
      microKobo += t.amount_kobo;
    }
    const weekday = new Date(`${t.date}T00:00:00Z`).getUTCDay(); // 0 Sunday … 6 Saturday
    if (weekday === 5 || weekday === 6 || weekday === 0) {
      weekendKobo += t.amount_kobo;
      weekendCount++;
    }
  }
  const surge = total > 0 ? (weekendKobo / total) * 100 : 0;
  const whole = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
  const warnings: string[] = [];
  const cuts: string[] = [];
  if (surge > 60 && total > 1_000_000) {
    warnings.push(
      `${surge.toFixed(1)}% of your spending occurs between Friday and Sunday. Weekend outings are your primary financial leak.`,
    );
    cuts.push("Set a strict Friday-Sunday cash or debit card allowance to curb weekend surges.");
  }
  if (microCount >= 10) {
    warnings.push(`${microCount} small debits under ₦2,500 leaked ${whole(microKobo)} in micro-transfers and airtime.`);
    cuts.push("Consolidate airtime and data recharges to once per week instead of frequent micro-topups.");
  }
  return {
    total_analyzed_txns: debits.length,
    late_night_kobo: 0,
    late_night_count: 0,
    weekend_kobo: weekendKobo,
    weekend_count: weekendCount,
    weekend_surge_percentage: Math.round(surge * 10) / 10,
    micro_drain_count: microCount,
    micro_drain_kobo: microKobo,
    warnings,
    actionable_cuts: cuts,
  };
}

/** Port of ai/subscriptions.py scan_subscriptions, on top of the recurring finder. */
function subscriptions(db: Db): SubscriptionItem[] {
  const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  return recurring(db)
    .map((r) => {
      const monthly = r.period_days === 7 ? r.amount_kobo * 4 : r.period_days === 14 ? r.amount_kobo * 2 : r.amount_kobo;
      const amount = (monthly / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return {
        merchant: titleCase(r.merchant_key),
        monthly_kobo: monthly,
        annual_kobo: monthly * 12,
        frequency_days: r.period_days,
        cancellation_url: null,
        cancellation_email_template:
          `Subject: Notice of Cancellation - Account Recurring Charge (${r.merchant_key})\n\n` +
          `Dear Support Team,\n\nI am writing to formally request the cancellation of my subscription for ${r.merchant_key} ` +
          `(recurring billing of ₦${amount}), effective immediately.\n\n` +
          `Please confirm receipt of this cancellation and ensure no further debits occur.\n\nThank you,\nSpendLens Account Holder`,
      };
    })
    .sort((a, b) => b.annual_kobo - a.annual_kobo);
}

/** Port of ai/investments.py project_investment_growth. */
function projectGrowth(monthly: number, months: number, rate: number): InvestmentProjection {
  if (monthly <= 0 || months <= 0)
    return { total_principal_kobo: 0, total_future_value_kobo: 0, gain_kobo: 0, annual_rate_pct: rate, months };
  const r = rate / 100 / 12;
  let fv = 0;
  for (let i = 0; i < months; i++) fv = (fv + monthly) * (1 + r);
  const principal = monthly * months;
  const value = Math.round(fv);
  return {
    total_principal_kobo: principal,
    total_future_value_kobo: value,
    gain_kobo: Math.max(0, value - principal),
    annual_rate_pct: rate,
    months,
  };
}

const INVESTMENT_OPTIONS = [
  {
    title: "Money Market Mutual Fund (MMF)",
    asset_class: "Money Market",
    rate: 16.5,
    risk_level: "Low",
    min: 500_000,
    horizon_label: "Liquid / Short-term (1 - 6 months)",
    minHorizon: 0,
    description:
      "Invests in short-term bank deposits and government securities. Offers high liquidity (withdraw within 24-48 hours) with yields significantly higher than bank savings.",
    regulatory_body: "Securities and Exchange Commission (SEC Nigeria)",
  },
  {
    title: "Nigerian Treasury Bills (T-Bills)",
    asset_class: "Sovereign Debt",
    rate: 19.0,
    risk_level: "Very Low",
    min: 10_000_000,
    horizon_label: "Fixed Horizon (91, 182, or 364 days)",
    minHorizon: 0,
    description:
      "Direct credit backed by the Federal Government of Nigeria and Central Bank of Nigeria. Zero default risk, interest paid upfront at auction.",
    regulatory_body: "Debt Management Office (DMO) / CBN",
  },
  {
    title: "FGN Savings Bond (FGNSB)",
    asset_class: "Retail Sovereign Bond",
    rate: 17.5,
    risk_level: "Very Low",
    min: 1_000_000,
    horizon_label: "Medium-term (2 - 3 years, quarterly coupon)",
    minHorizon: 6,
    description:
      "Targeted retail bond issued monthly by the Debt Management Office. Pays guaranteed quarterly coupon payments directly into your bank account.",
    regulatory_body: "Debt Management Office (DMO)",
  },
  {
    title: "US Dollar Fixed Income Mutual Fund",
    asset_class: "Foreign Currency Hedging",
    rate: 8.0,
    risk_level: "Moderate",
    min: 5_000_000,
    horizon_label: "Long-term (2+ years)",
    minHorizon: 24,
    description:
      "Invests in US Dollar Eurobonds and foreign sovereign notes. Protects purchasing power against Naira currency depreciation.",
    regulatory_body: "Securities and Exchange Commission (SEC Nigeria)",
  },
];

/** Port of ai/investments.py suggest_investments. */
function investmentSuggestions(q: Record<string, unknown>): InvestmentOption[] {
  const spare = Number(q.monthly_spare_kobo) || 0;
  const horizon = Number(q.horizon_months) || 12;
  const effective = Math.max(1_000_000, spare);
  return INVESTMENT_OPTIONS.filter((o) => horizon >= o.minHorizon).map((o) => {
    const p = projectGrowth(effective, horizon, o.rate);
    return {
      title: o.title,
      asset_class: o.asset_class,
      benchmark_annual_rate_pct: o.rate,
      risk_level: o.risk_level,
      minimum_monthly_kobo: o.min,
      horizon_label: o.horizon_label,
      projected_growth_kobo: p.total_future_value_kobo,
      total_invested_kobo: p.total_principal_kobo,
      net_gain_kobo: p.gain_kobo,
      description: o.description,
      regulatory_body: o.regulatory_body,
    };
  });
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
    const state = body.state;
    if (state !== "confirmed" && state !== "rejected") fail(422, "State must be confirmed or rejected.");
    const decision = state === "confirmed" ? "same" : "different";
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

  if (route === "POST /v1/chat") {
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 500) fail(422, "Ask something between 1 and 500 characters.");
    await sleep(500 + Math.random() * 500);
    return chatReply(db, message);
  }

  if (route === "POST /v1/chat/transcriptions") {
    const file = req.form?.get("file");
    if (!(file instanceof Blob) || !file.size) fail(422, "The voice note was empty.");
    await sleep(600);
    const text = SAMPLE_TRANSCRIPTS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTS.length)];
    return { text } satisfies Transcription;
  }

  if (route === "POST /v1/goals/project") {
    const p = (body ?? {}) as Record<string, unknown>;
    const goalName = typeof p.goal_name === "string" ? p.goal_name.trim() : "";
    const target = Number(p.target_kobo) || 0;
    const saved = Number(p.saved_kobo) || 0;
    const monthlySaving = Number(p.monthly_saving_kobo) || 0;
    const rate = typeof p.annual_rate_pct === "number" ? Math.max(0, Math.min(100, p.annual_rate_pct)) : 0;

    if (!goalName || goalName.length > 60) fail(422, "Goal name must be between 1 and 60 characters.");
    if (target <= 0) fail(422, "Target amount must be greater than zero.");
    if (saved < 0 || monthlySaving < 0) fail(422, "Amounts cannot be negative.");

    const monthlyRate = rate / 100 / 12;
    let balance = saved;
    let months: number | null = balance >= target ? 0 : null;
    if (months === null) {
      for (let m = 1; m <= 600; m++) {
        balance = Math.round(balance * (1 + monthlyRate)) + monthlySaving;
        if (balance >= target) {
          months = m;
          break;
        }
      }
    }

    return {
      goal_name: goalName,
      months_to_goal: months,
      final_balance_kobo: balance,
      annual_rate_pct: rate,
      note: "Projection uses the rate you entered. It is an assumption, not a forecast or advice.",
    };
  }

  if (route === "GET /v1/habits") return habits(db);
  if (route === "GET /v1/subscriptions") return subscriptions(db);
  if (route === "GET /v1/investments/suggestions") return investmentSuggestions(q);
  if (route === "POST /v1/investments/project") {
    const monthly = Number(body.monthly_kobo);
    const months = body.months === undefined ? 12 : Number(body.months);
    const rate = body.annual_rate_pct === undefined ? 15 : Number(body.annual_rate_pct);
    if (!Number.isInteger(monthly) || monthly < 0) fail(422, "monthly_kobo must be a whole number of kobo.");
    return projectGrowth(monthly, months, rate);
  }

  fail(404, `No fixture for ${route}.`);
}
