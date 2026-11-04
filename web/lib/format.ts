// Display only. Never add, subtract or multiply money in the UI (frontend PRD R1).
const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });
const nairaWhole = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const fmt = (kobo: number) => naira.format(kobo / 100);

export const fmtWhole = (kobo: number) => nairaWhole.format(kobo / 100);
