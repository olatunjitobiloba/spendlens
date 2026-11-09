import { NextResponse, type NextRequest } from "next/server";

import { getServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/utils/redirect";

// Magic-link landing: swap the one-time code for a session cookie.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const supabase = await getServerSupabase();

  if (!code || !supabase) return NextResponse.redirect(new URL("/login?error=link", request.url));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=link", request.url));
  return NextResponse.redirect(new URL(next, request.url));
}
