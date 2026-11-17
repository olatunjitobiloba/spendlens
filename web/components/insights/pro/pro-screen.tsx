"use client";

import { Crown02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { PlanComparison } from "./pro-features";

/** Shown price only. There is no billing behind this page yet. */
const PRO_PRICE_KOBO = 250_000;
const PRO_DAYS = 30;

/**
 * Display only: the Pro offer as it would look. Nothing here calls the API,
 * takes payment or changes what the app unlocks.
 */
export function ProScreen() {
  return (
    <>
      <PageHeader
        title="SpendLens Pro"
        description="Free gives you the summary and scenarios to view. Pro adds the tools for keeping a plan going."
      />
      <div className="space-y-4">
        <PlanComparison priceKobo={PRO_PRICE_KOBO} days={PRO_DAYS} current="free" />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" disabled aria-describedby="pro-note">
            <Icon icon={Crown02Icon} />
            Upgrade to Pro
          </Button>
          <p id="pro-note" className="text-[13px] text-t3">
            Payments aren&apos;t switched on yet.
          </p>
        </div>
      </div>
    </>
  );
}
