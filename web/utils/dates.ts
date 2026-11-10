import type { DateRange } from "@/types/api";

/** "2026-10" -> { start: "2026-10-01", end: "2026-10-31" }. Dates only, never money. */
export function monthToRange(month: string | null | undefined): DateRange | undefined {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return undefined;
  const [y, m] = month.split("-").map(Number);
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { start: `${month}-01`, end };
}
