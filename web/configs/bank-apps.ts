// Look and feel of each bank's mobile app, for the integration simulator.
// These are close approximations built from each bank's brand colour, not
// copies of the real apps. Logos come from public/banks (see configs/banks.ts).

import { BANKS, type Bank } from "@/configs/banks";

/**
 * classic: solid brand header with the balance on it (most commercial banks).
 * card:    light app with a brand-coloured balance card (digital banks).
 * dark:    dark app with brand accents.
 */
export type AppLayout = "classic" | "card" | "dark";

export type BankGroup = "Commercial banks" | "Non-interest banks" | "Merchant banks" | "Digital and microfinance banks";

export type BankApp = Bank & {
  group: BankGroup;
  /** Main brand colour, used for headers and fills. */
  color: string;
  layout: AppLayout;
};

const THEMES: Record<string, { color: string; layout?: AppLayout }> = {
  "access-bank": { color: "#F37021" },
  "citibank-nigeria": { color: "#056DAE" },
  "ecobank-nigeria": { color: "#005B82" },
  "fidelity-bank": { color: "#1F2A6D" },
  "first-bank-of-nigeria": { color: "#003366" },
  "first-city-monument-bank": { color: "#5C2D91" },
  "globus-bank": { color: "#0055A5", layout: "card" },
  "guaranty-trust-bank": { color: "#DD4F05" },
  "keystone-bank": { color: "#004C97" },
  "nova-bank": { color: "#0C2D57", layout: "card" },
  "optimus-bank-limited": { color: "#0B3B60", layout: "card" },
  "parallex-bank": { color: "#8B1D41", layout: "card" },
  "polaris-bank": { color: "#5A2A82" },
  "premiumtrust-bank": { color: "#7A1F2B", layout: "card" },
  "providus-bank": { color: "#F5B21B", layout: "dark" },
  "signature-bank-ltd": { color: "#0A2240", layout: "card" },
  "stanbic-ibtc-bank": { color: "#0033A1" },
  "standard-chartered-bank": { color: "#0072AA", layout: "card" },
  "sterling-bank": { color: "#DB353A" },
  "suntrust-bank": { color: "#E8861A", layout: "card" },
  "titan-trust-bank": { color: "#1C4E9D", layout: "card" },
  "union-bank-of-nigeria": { color: "#0094D8" },
  "united-bank-for-africa": { color: "#D42E12" },
  "unity-bank": { color: "#3A9B3A" },
  "wema-bank": { color: "#990D81" },
  "zenith-bank": { color: "#E30613" },
  "jaiz-bank": { color: "#00843D" },
  "lotus-bank": { color: "#6B2C91", layout: "card" },
  "taj-bank": { color: "#7A1E5F", layout: "card" },
  "alternative-bank": { color: "#0B6E4F", layout: "card" },
  "coronation-merchant-bank": { color: "#0F2C4C" },
  "fsdh-merchant-bank-limited": { color: "#0F4C81" },
  "greenwich-merchant-bank": { color: "#006A4E" },
  "rand-merchant-bank": { color: "#00807A", layout: "dark" },
  "alat-by-wema": { color: "#E5006A", layout: "card" },
  carbon: { color: "#3A1E8C", layout: "card" },
  "fairmoney-microfinance-bank": { color: "#5F2EEA", layout: "card" },
  "kuda-bank": { color: "#40196D", layout: "card" },
  "moniepoint-mfb-ng": { color: "#0357EE", layout: "card" },
  paycom: { color: "#1DCF9F", layout: "card" },
  palmpay: { color: "#7B3FE4", layout: "card" },
  "rubies-mfb": { color: "#C8102E", layout: "dark" },
  vfd: { color: "#F04E23", layout: "dark" },
};

// configs/banks.ts lists banks in group order; these are the slugs that open each group.
const GROUP_STARTS: [string, BankGroup][] = [
  ["access-bank", "Commercial banks"],
  ["jaiz-bank", "Non-interest banks"],
  ["coronation-merchant-bank", "Merchant banks"],
  ["alat-by-wema", "Digital and microfinance banks"],
];

export const BANK_APPS: BankApp[] = (() => {
  let group: BankGroup = "Commercial banks";
  return BANKS.map((b) => {
    group = GROUP_STARTS.find(([slug]) => slug === b.slug)?.[1] ?? group;
    const theme = THEMES[b.slug] ?? { color: "#007BF5" };
    return { ...b, group, color: theme.color, layout: theme.layout ?? "classic" };
  });
})();

export const BANK_GROUPS: BankGroup[] = GROUP_STARTS.map(([, g]) => g);

export const DEFAULT_BANK = "wema-bank";

function channel(hex: string, i: number) {
  return parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
}

function luminance(hex: string) {
  const [r, g, b] = [0, 1, 2].map((i) => {
    const c = channel(hex, i) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Text colour that reads on top of the brand colour. */
export function onColor(hex: string) {
  return luminance(hex) > 0.36 ? "#0B0B0C" : "#FFFFFF";
}

/** The brand colour darkened until it reads as text on white (yellows and light greens). */
export function inkColor(hex: string) {
  if (luminance(hex) <= 0.2) return hex;
  const toHex = (n: number) => Math.round(n * 0.62).toString(16).padStart(2, "0");
  return `#${[0, 1, 2].map((i) => toHex(channel(hex, i))).join("")}`;
}
