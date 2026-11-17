// Public environment values, shared by the browser and server routes.
// No secret keys belong in the frontend (technical doc §2).

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** Kora test key (pk_test_...) until told otherwise. */
export const KORA_PUBLIC_KEY = process.env.NEXT_PUBLIC_KORA_PUBLIC_KEY ?? "";

/** Cookie that remembers the sample/live data source switch. */
export const MODE_COOKIE = "spendlens-mode";

/** Fixture mode from env alone: no API URL, or forced on. */
export const envFixtureMode = process.env.NEXT_PUBLIC_FIXTURE_MODE === "true" || !API_URL;
