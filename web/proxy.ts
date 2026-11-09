import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  MODE_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  envFixtureMode,
  supabaseConfigured,
} from "@/configs/env";
import { safeNext } from "@/utils/redirect";

// Auth guard for the embedded module.
// - Sample (fixture) mode stays open, so a first-time visitor can try the
//   demo without signing up (PRD R4).
// - Live mode needs a Supabase session; without one we send people to /login.
// - /login sends signed-in people on to where they were going.
// This is an optimistic check. The FastAPI backend still verifies the
// bearer token on every call.

function isSampleMode(request: NextRequest) {
  return envFixtureMode || request.cookies.get(MODE_COOKIE)?.value === "fixtures";
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const onLogin = pathname === "/login";

  if (!onLogin && isSampleMode(request)) return NextResponse.next();

  if (!supabaseConfigured) {
    // Live API without auth config: nothing can sign in, so fall back to sample mode.
    if (onLogin) return NextResponse.next();
    const res = NextResponse.redirect(new URL(`${pathname}${search}`, request.url));
    res.cookies.set(MODE_COOKIE, "fixtures", { path: "/", sameSite: "lax" });
    return res;
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims verifies the JWT, and refreshes the session cookie when needed.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (onLogin && signedIn) {
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    return withCookies(NextResponse.redirect(new URL(next, request.url)));
  }

  if (!onLogin && !signedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return withCookies(NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: ["/insights/:path*", "/login"],
};
