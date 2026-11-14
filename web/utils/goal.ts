// Goal maths. Pure and in whole kobo, so no floating-point rounding reaches the result.

/**
 * Reads a naira amount typed by the user ("150,000", "₦2500.50") as whole kobo.
 * Returns null for anything that is not a positive amount with at most two decimals.
 */
export function parseNairaToKobo(input: string): number | null {
  const clean = input.replace(/[₦,\s]/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(clean);
  if (!match) return null;
  const kobo = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return kobo > 0 && Number.isSafeInteger(kobo) ? kobo : null;
}

/**
 * Whole months needed to save `targetKobo` at `monthlyKobo` a month, rounded up.
 * Returns null when nothing is saved each month, since the goal is never reached.
 */
export function monthsToGoal(targetKobo: number, monthlyKobo: number): number | null {
  if (targetKobo <= 0 || monthlyKobo <= 0) return null;
  return Math.floor((targetKobo + monthlyKobo - 1) / monthlyKobo);
}
