/** Link to the Review screen filtered to the transactions behind a number (PRD R2). */
export function reviewHref(params: Record<string, string | undefined>) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>;
  const qs = new URLSearchParams(clean).toString();
  return qs ? `/insights/review?${qs}` : "/insights/review";
}
