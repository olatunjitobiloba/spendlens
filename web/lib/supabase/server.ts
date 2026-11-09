import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/configs/env";

/** Supabase client for server actions and route handlers. Null when not configured. */
export async function getServerSupabase() {
  if (!supabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
}
