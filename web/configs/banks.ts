// Banks licensed in Nigeria, for labelling transactions. Logos live in
// public/banks/<slug>.png (sourced from nigerianbanks.xyz).
// `code` is the CBN/NIBSS bank code, so an API can send any of slug, name or code.

export type Bank = { slug: string; name: string; short: string; code: string };

export const BANKS: Bank[] = [
  // Commercial banks
  { slug: "access-bank", name: "Access Bank", short: "Access", code: "044" },
  { slug: "citibank-nigeria", name: "Citibank Nigeria", short: "Citibank", code: "023" },
  { slug: "ecobank-nigeria", name: "Ecobank Nigeria", short: "Ecobank", code: "050" },
  { slug: "fidelity-bank", name: "Fidelity Bank", short: "Fidelity", code: "070" },
  { slug: "first-bank-of-nigeria", name: "First Bank of Nigeria", short: "FirstBank", code: "011" },
  { slug: "first-city-monument-bank", name: "First City Monument Bank", short: "FCMB", code: "214" },
  { slug: "globus-bank", name: "Globus Bank", short: "Globus", code: "00103" },
  { slug: "guaranty-trust-bank", name: "Guaranty Trust Bank", short: "GTBank", code: "058" },
  { slug: "keystone-bank", name: "Keystone Bank", short: "Keystone", code: "082" },
  { slug: "nova-bank", name: "Nova Bank", short: "Nova", code: "561" },
  { slug: "optimus-bank-limited", name: "Optimus Bank", short: "Optimus", code: "107" },
  { slug: "parallex-bank", name: "Parallex Bank", short: "Parallex", code: "104" },
  { slug: "polaris-bank", name: "Polaris Bank", short: "Polaris", code: "076" },
  { slug: "premiumtrust-bank", name: "PremiumTrust Bank", short: "PremiumTrust", code: "105" },
  { slug: "providus-bank", name: "Providus Bank", short: "Providus", code: "101" },
  { slug: "signature-bank-ltd", name: "Signature Bank", short: "Signature", code: "106" },
  { slug: "stanbic-ibtc-bank", name: "Stanbic IBTC Bank", short: "Stanbic", code: "221" },
  { slug: "standard-chartered-bank", name: "Standard Chartered Bank", short: "StanChart", code: "068" },
  { slug: "sterling-bank", name: "Sterling Bank", short: "Sterling", code: "232" },
  { slug: "suntrust-bank", name: "SunTrust Bank", short: "SunTrust", code: "100" },
  { slug: "titan-trust-bank", name: "Titan Trust Bank", short: "Titan", code: "102" },
  { slug: "union-bank-of-nigeria", name: "Union Bank of Nigeria", short: "Union Bank", code: "032" },
  { slug: "united-bank-for-africa", name: "United Bank for Africa", short: "UBA", code: "033" },
  { slug: "unity-bank", name: "Unity Bank", short: "Unity", code: "215" },
  { slug: "wema-bank", name: "Wema Bank", short: "Wema", code: "035" },
  { slug: "zenith-bank", name: "Zenith Bank", short: "Zenith", code: "057" },
  // Non-interest banks
  { slug: "jaiz-bank", name: "Jaiz Bank", short: "Jaiz", code: "301" },
  { slug: "lotus-bank", name: "Lotus Bank", short: "Lotus", code: "303" },
  { slug: "taj-bank", name: "TAJBank", short: "TAJBank", code: "302" },
  { slug: "alternative-bank", name: "The Alternative Bank", short: "AltBank", code: "000304" },
  // Merchant banks
  { slug: "coronation-merchant-bank", name: "Coronation Merchant Bank", short: "Coronation", code: "559" },
  { slug: "fsdh-merchant-bank-limited", name: "FSDH Merchant Bank", short: "FSDH", code: "501" },
  { slug: "greenwich-merchant-bank", name: "Greenwich Merchant Bank", short: "Greenwich", code: "562" },
  { slug: "rand-merchant-bank", name: "Rand Merchant Bank", short: "RMB", code: "502" },
  // Digital banks and microfinance banks
  { slug: "alat-by-wema", name: "ALAT by Wema", short: "ALAT", code: "035A" },
  { slug: "carbon", name: "Carbon", short: "Carbon", code: "565" },
  { slug: "fairmoney-microfinance-bank", name: "FairMoney Microfinance Bank", short: "FairMoney", code: "51318" },
  { slug: "kuda-bank", name: "Kuda Bank", short: "Kuda", code: "50211" },
  { slug: "moniepoint-mfb-ng", name: "Moniepoint Microfinance Bank", short: "Moniepoint", code: "50515" },
  { slug: "paycom", name: "OPay", short: "OPay", code: "999992" },
  { slug: "palmpay", name: "PalmPay", short: "PalmPay", code: "999991" },
  { slug: "rubies-mfb", name: "Rubies Microfinance Bank", short: "Rubies", code: "125" },
  { slug: "vfd", name: "VFD Microfinance Bank", short: "VFD", code: "566" },
];

const norm = (s: string) => s.trim().toLowerCase();
const index = new Map<string, Bank>();
for (const b of BANKS) for (const k of [b.slug, b.name, b.short, b.code]) index.set(norm(k), b);

/** Look a bank up by slug, full name, short name or bank code. */
export function findBank(value: string | null | undefined): Bank | null {
  return value ? (index.get(norm(value)) ?? null) : null;
}

/** Full name when it fits in 10 letters, otherwise the short form. */
export function bankLabel(name: string, short?: string): string {
  return name.length > 10 && short ? short : name;
}

export const bankLogo = (b: Bank) => `/banks/${b.slug}.png`;
