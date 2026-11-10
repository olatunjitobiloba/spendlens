// Display only. Never add, subtract or multiply money in the UI (frontend PRD R1).
const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });
const nairaWhole = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const fmt = (kobo: number) => naira.format(kobo / 100);

export const fmtWhole = (kobo: number) => nairaWhole.format(kobo / 100);

// Dates, shown in UTC so a date never shifts with the viewer's time zone.

export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!iso) return "";
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

export function formatRange(r: { start: string; end: string } | null | undefined) {
  if (!r || !r.start) return "";
  return `${formatDate(r.start, { day: "numeric", month: "short" })} – ${formatDate(r.end)}`;
}

/** "2026-10" -> "October 2026" */
export function formatMonth(month: string, style: "long" | "short" = "long") {
  if (!month) return "";
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  });
}
