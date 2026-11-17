// A synthetic Nigerian bank statement, generated in the browser on demand.
// Nothing is fetched, so it works the same in dev and production.

/** The columns a file needs, as shown to people. `time` is optional and the sample adds it. */
export const SAMPLE_CSV_HEADER = "date,description,amount,direction,account_alias,bank";
const GENERATED_HEADER = "date,time,description,amount,direction,account_alias,bank";
export const SAMPLE_FILENAME = "spendlens-sample-transactions.csv";

type Account = { alias: string; bank: string };

const GTB: Account = { alias: "Current account 4821", bank: "guaranty-trust-bank" };
const ZENITH: Account = { alias: "Debit card 0937", bank: "zenith-bank" };
const OPAY: Account = { alias: "OPay wallet 7710", bank: "paycom" };
const ACCESS: Account = { alias: "Savings account 2290", bank: "access-bank" };
const ECOBANK: Account = { alias: "Ecobank account 6142", bank: "ecobank-nigeria" };

// Only banks the API recognises (ai/banks.py); anything else is stored as "other".
const EVERYDAY = [ZENITH, OPAY, GTB, ECOBANK];

/** [description, min naira, max naira, accounts, chance per day] */
const DAILY: [string, number, number, Account[], number][] = [
  ["DANFO BUS FARE", 300, 1200, [OPAY, GTB], 0.45],
  ["RIDEGO TRANSPORT TRIP", 1800, 7500, [GTB, OPAY, ZENITH], 0.35],
  ["BRT BUS FARE CARD", 1000, 3000, [OPAY, ZENITH, GTB], 0.15],
  ["CHOWHUB FOOD ORDER", 2500, 9500, [OPAY, ZENITH, ECOBANK], 0.2],
  ["BEAN AND BREW CAFE FOOD", 1500, 4800, [OPAY, ZENITH], 0.12],
  ["SUYA SPOT FOOD VI", 2000, 6000, [ZENITH, OPAY, ECOBANK], 0.1],
  ["MAMA TOKS RICE AND STEW", 1500, 4500, [OPAY, ECOBANK, ZENITH], 0.08],
  ["AIRTIME DATA BUNDLE", 500, 5000, [ECOBANK, GTB, OPAY], 0.15],
  ["POS WITHDRAWAL LAGOS", 5000, 20000, [OPAY, ECOBANK], 0.07],
];

/** Larger, less frequent spends: [description, min, max, accounts, chance per week] */
const WEEKLY: [string, number, number, Account[], number][] = [
  ["FRESHMART FOOD STORE LEKKI", 12000, 38000, [ZENITH], 0.6],
  ["GREENBASKET FOOD MARKET", 8000, 25000, [ZENITH, ECOBANK], 0.4],
  ["SHOPRITE FOOD ITEMS IKEJA", 9000, 32000, [ACCESS, ZENITH], 0.3],
  ["MEDIPLUS PHARMACY", 3000, 15000, [ZENITH, ACCESS], 0.2],
  ["STYLEHAUS CLOTHING PURCHASE", 8000, 45000, [ZENITH, GTB], 0.15],
  ["GADGETBAY", 15000, 85000, [ZENITH, ECOBANK, OPAY], 0.08],
  ["FILMHOUSE CINEMA TICKET", 4000, 12000, [ZENITH], 0.1],
  ["FUEL TOTALENERGIES", 15000, 40000, [ECOBANK, ACCESS], 0.35],
  ["TRANSFER TO EXTERNAL WALLET CHIDI OKAFOR", 10000, 50000, [ECOBANK, OPAY], 0.25],
  ["TRF TO MUM", 20000, 60000, [GTB, ACCESS], 0.15],
];

/** Fixed monthly items: [description, naira, day of month, account] */
const MONTHLY: [string, number, number, Account][] = [
  ["TRF RENT ADEOLA PROPERTIES", 150000, 1, GTB],
  ["STREAMCO SUBSCRIPTION", 4400, 5, ECOBANK],
  ["GYMHUB MONTHLY PLAN", 15000, 3, ZENITH],
  ["CLOUDBOX STORAGE", 1500, 12, ZENITH],
  ["SPOTIFY PREMIUM", 1300, 9, ECOBANK],
  ["DSTV COMPACT", 15700, 7, ACCESS],
  ["IKEDC ELECTRICITY PREPAID TOKEN", 20000, 14, ACCESS],
  ["PIGGYVEST TRANSFER TO SAVINGS", 25000, 26, ACCESS],
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Row = { date: string; description: string; amount: number; direction: "debit" | "credit"; account: Account };

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
/**
 * Naira amounts rounded to a believable step: ₦10 under ₦2k (fares and top-ups
 * vary, so they never look like a subscription), ₦50 under ₦10k, ₦100 above.
 */
function amount(min: number, max: number) {
  const raw = min + Math.random() * (max - min);
  const step = raw < 2000 ? 10 : raw < 10000 ? 50 : 100;
  return Math.max(step, Math.round(raw / step) * step);
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");
/** Most payments in the day; some food and rides late at night, so night-time habits show up. */
const NIGHT_OWL = /CHOWHUB|SUYA|RIDEGO|BEAN AND BREW/;
function timeFor(description: string) {
  const late = NIGHT_OWL.test(description) && Math.random() < 0.25;
  const hour = late ? pick([22, 23, 0, 1]) : 7 + Math.floor(Math.random() * 14);
  return `${pad(hour)}:${pad(Math.floor(Math.random() * 60))}`;
}
const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * About three months of transactions ending yesterday, across several Nigerian
 * banks: salary, rent, subscriptions, groceries, transport and food. Amounts
 * vary on every call, so each generated file is new to the API.
 */
export function generateSampleCsv(today = new Date()): string {
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 3, end.getUTCDate() + 1));
  const rows: Row[] = [];
  const salary = amount(420000, 520000);

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = iso(d);
    const dom = d.getUTCDate();

    if (dom === 25)
      rows.push({
        date,
        description: `MONTHLY SALARY ${MONTHS[d.getUTCMonth()]} BRIGHTWAVE LTD`,
        amount: salary,
        direction: "credit",
        account: GTB,
      });
    for (const [description, naira, day, account] of MONTHLY)
      if (dom === day) rows.push({ date, description, amount: naira, direction: "debit", account });

    for (const [description, min, max, accounts, chance] of DAILY)
      if (Math.random() < chance) rows.push({ date, description, amount: amount(min, max), direction: "debit", account: pick(accounts) });
    if (d.getUTCDay() === 6)
      for (const [description, min, max, accounts, chance] of WEEKLY)
        if (Math.random() < chance) rows.push({ date, description, amount: amount(min, max), direction: "debit", account: pick(accounts) });

    if (Math.random() < 0.06)
      rows.push({ date, description: "ALLOWANCE RECEIVED FROM TUNDE BAKARE", amount: amount(5000, 40000), direction: "credit", account: pick([OPAY, ECOBANK]) });
    // Always at least one row a day, so the file has no coverage gaps.
    if (!rows.length || rows[rows.length - 1].date !== date)
      rows.push({ date, description: "DANFO BUS FARE", amount: amount(300, 900), direction: "debit", account: pick(EVERYDAY) });
  }

  const lines = rows.map((r) =>
    [
      r.date,
      timeFor(r.description),
      csvCell(r.description),
      r.amount.toFixed(2),
      r.direction,
      csvCell(r.account.alias),
      r.account.bank,
    ].join(","),
  );
  return [GENERATED_HEADER, ...lines].join("\n") + "\n";
}

/** A freshly generated sample statement as a File, ready for the import endpoints. */
export async function loadSampleFile(): Promise<File> {
  return new File([generateSampleCsv()], SAMPLE_FILENAME, { type: "text/csv" });
}

/** Generates a sample statement and saves it through the browser. */
export function downloadSampleCsv() {
  const url = URL.createObjectURL(new Blob([generateSampleCsv()], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = SAMPLE_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
