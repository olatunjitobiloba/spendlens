"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { sendMagicLink, type MagicLinkState } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { supabaseConfigured } from "@/configs/env";
import { setFixtureOverride } from "@/lib/api";

const initial: MagicLinkState = { status: "idle" };

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/insights";
  const [state, action, pending] = useActionState(sendMagicLink, initial);
  const linkExpired = params.get("error") === "link" && state.status === "idle";

  function trySample() {
    setFixtureOverride(true);
    // Full load on purpose: proxy.ts reads the new mode cookie.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/insights");
  }

  return (
    <div className="w-full max-w-sm rounded-[1.25rem] border border-line bg-panel p-6">
      <Link href="/" aria-label="SpendLens home" className="inline-block rounded-full">
        <Logo />
      </Link>
      <h1 className="mt-6 text-[20px] font-[650] tracking-[-0.02em]">Sign in to Money Insights</h1>
      <p className="mt-1 text-[13.5px] text-t3">We email you a one-time link. No password, and never your bank login.</p>

      {state.status === "sent" ? (
        <Notice tone="positive" className="mt-5" title="Check your inbox">
          We sent a sign-in link to {state.email}. Open it on this device.
        </Notice>
      ) : !supabaseConfigured ? (
        <Notice tone="warn" className="mt-5" title="Sign-in is not set up here">
          This deployment has no Supabase keys. Use sample mode instead.
        </Notice>
      ) : (
        <form action={action} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="text-[13px] font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={state.status === "error"}
              aria-describedby={state.status === "error" ? "email-error" : undefined}
              className="mt-1 h-10 w-full rounded-xl border border-line-strong bg-panel px-3 text-[14px]"
            />
          </div>
          {linkExpired && (
            <Notice tone="warn" title="That link has expired">
              Sign-in links work once and expire. Ask for a new one below.
            </Notice>
          )}
          {state.status === "error" && (
            <div id="email-error">
              <Notice tone="danger" title="Could not send the link">
                {state.message}
              </Notice>
            </div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Email me a link"}
          </Button>
        </form>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-[13px] text-t3">Just looking? Try it on synthetic data, no sign-up.</p>
        <Button variant="outline" className="mt-3 w-full" onClick={trySample}>
          Use sample mode
        </Button>
      </div>
    </div>
  );
}
