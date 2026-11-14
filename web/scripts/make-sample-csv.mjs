// Writes public/fixtures/sample-transactions.csv: three months of synthetic
// transactions for the demo. Every name is fictional. Seeded, so the output
// is the same on every run. Run with: node scripts/make-sample-csv.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let seed = 20261101;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
// Whole naira between lo and hi, returned in kobo.
const naira = (lo, hi) => Math.round(lo + rand() * (hi - lo)) * 100;

const CURRENT = "Current account 4821";
const CARD = "Debit card 0937";
const OPAY = "OPay wallet 7710";
const MONIEPOINT = "Moniepoint account 3306";
const SAVINGS = "Savings account 5194";
const KUDA = "Kuda account 2268";
// Each account's bank, as a slug from web/configs/banks.ts.
const BANK_OF = {
  [CURRENT]: "guaranty-trust-bank",
  [CARD]: "zenith-bank",
  [OPAY]: "paycom",
  [MONIEPOINT]: "moniepoint-mfb-ng",
  [SAVINGS]: "access-bank",
  [KUDA]: "kuda-bank",
};
const rows = [];
const add = (date, description, amount_kobo, direction = "debit", account = CURRENT) =>
  rows.push({ date, description, amount_kobo, direction, account });

const months = [
  { y: 2026, m: 8, days: 31 },
  { y: 2026, m: 9, days: 30 },
  { y: 2026, m: 10, days: 31 },
];
const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
// September 8 to 19 has no records at all, to show a coverage warning.
const inGap = (m, d) => m === 9 && d >= 8 && d <= 19;

for (const { y, m, days } of months) {
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en", { month: "short" }).toUpperCase();
  add(iso(y, m, 1), "TRF RENT ADEOLA PROPERTIES", 15_000_000);
  add(iso(y, m, 3), "GYMHUB MONTHLY PLAN", 1_500_000, "debit", CARD);
  add(iso(y, m, 5), "STREAMCO SUBSCRIPTION", 450_000, "debit", KUDA);
  add(iso(y, m, 6), "POWERGRID PREPAID TOKEN", naira(18_000, 24_000), "debit", SAVINGS);
  add(iso(y, m, 28), `SALARY ${label} BRIGHTWAVE LTD`, 45_000_000, "credit");

  for (let d = 1; d <= days; d++) {
    if (inGap(m, d)) continue;
    const date = iso(y, m, d);
    if (d % 7 === 2) add(date, pick(["FRESHMART LEKKI", "FRESHMART YABA", "GREENBASKET MARKET"]), naira(17_000, 26_000), "debit", CARD);
    if (rand() < 0.36) add(date, pick(["CHOWHUB ORDER", "MAMA TOKS KITCHEN", "SUYA CORNER VI", "BEAN AND BREW CAFE"]), naira(2_800, 9_500), "debit", pick([CARD, CARD, MONIEPOINT, KUDA]));
    if (rand() < 0.45) add(date, pick(["RIDEGO TRIP", "RIDEGO TRIP", "BRT CARD TOPUP", "DANFO FARE"]), naira(900, 5_200), "debit", pick([CARD, CURRENT, OPAY, OPAY]));
    if (d % 9 === 4) add(date, "AIRTIME DATA BUNDLE", naira(2_000, 5_000), "debit", pick([CURRENT, OPAY, KUDA]));
    if (rand() < 0.07) add(date, pick(["STYLEHAUS ONLINE", "GADGETBAY", "BOOKNOOK"]), naira(6_000, 28_000), "debit", CARD);
    if (rand() < 0.05) add(date, `TRF TO 0${Math.floor(rand() * 1e9)} OKAFOR`, naira(5_000, 20_000), "debit", pick([OPAY, KUDA]));
    if (rand() < 0.04) add(date, `POS ${Math.floor(10000 + rand() * 89999)} LAGOS`, naira(1_500, 8_000), "debit", MONIEPOINT);
  }
}

// One-off and short-history items, so the forecast has to abstain for them.
add("2026-10-12", "CLOUDBOX STORAGE", 120_000, "debit", CARD);
add("2026-10-17", "MEDIPLUS PHARMACY", 1_240_000, "debit", CARD);
add("2026-10-22", "MEDIPLUS PHARMACY", 385_000, "debit", CARD);

// Two payments that appear on both accounts: possible duplicates to reconcile.
add("2026-10-09", "CHOWHUB ORDER 88213", 731_500, "debit", CARD);
add("2026-10-09", "CARD PURCHASE CHOWHUB", 731_500, "debit", CURRENT);
add("2026-08-21", "STYLEHAUS ONLINE 5521", 2_349_900, "debit", CARD);
add("2026-08-22", "WEB PMT STYLEHAUS", 2_349_900, "debit", CURRENT);
add("2026-09-26", "GADGETBAY 3381", 1_850_000, "debit", KUDA);
add("2026-09-27", "POS GADGETBAY IKEJA", 1_850_000, "debit", MONIEPOINT);

rows.sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
const csv = ["date,description,amount_kobo,direction,account,bank"]
  .concat(rows.map((r) => [r.date, r.description, r.amount_kobo, r.direction, r.account, BANK_OF[r.account]].join(",")))
  .join("\n");

const out = fileURLToPath(new URL("../public/fixtures/sample-transactions.csv", import.meta.url));
writeFileSync(out, csv + "\n");
console.log(`wrote ${rows.length} rows to ${out}`);
