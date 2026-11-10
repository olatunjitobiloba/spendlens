"use server";

import { headers } from "next/headers";

import { getServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/utils/redirect";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

/** Emails a one-time sign-in link. Login is the only thing Supabase does for us. */
export async function sendMagicLink(_prev: MagicLinkState, form: FormData): Promise<MagicLinkState> {
  const email = String(form.get("email") ?? "").trim();
  const next = safeNext(String(form.get("next") ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a full email address, like name@example.com." };
  }

  const supabase = await getServerSupabase();
  if (!supabase) return { status: "error", message: "Sign-in is not set up on this deployment. Use sample mode." };

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const redirect = new URL("/auth/callback", origin);
  redirect.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirect.toString() },
  });
  if (error) return { status: "error", message: `${error.message} Check the address and try again.` };
  return { status: "sent", email };
}

/** Ends the Supabase session cookie. The caller clears browser state. */
export async function signOut(): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
}
