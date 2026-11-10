// Public environment values, shared by the browser, server routes and proxy.ts.
// No secret keys belong in the frontend (technical doc §2).

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Kora test key (pk_test_...) until told otherwise. */
export const KORA_PUBLIC_KEY = process.env.NEXT_PUBLIC_KORA_PUBLIC_KEY ?? "";

/** Cookie that mirrors the "use sample mode" switch so proxy.ts can see it. */
export const MODE_COOKIE = "spendlens-mode";

/** Fixture mode from env alone: no API URL, or forced on. */
export const envFixtureMode = process.env.NEXT_PUBLIC_FIXTURE_MODE === "true" || !API_URL;
