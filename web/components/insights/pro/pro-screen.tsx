"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { useFixtureMode } from "@/hooks/use-fixture-mode";
import { useMe } from "@/providers/me-provider";
import { formatDate } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";
import { CheckoutPanel } from "./checkout-panel";
import { PlanComparison, ProFeatures } from "./pro-features";
import { ProSkeleton } from "../skeletons";

function ProActive({ until, justPaid, onEnded }: { until: string | null; justPaid: boolean; onEnded: () => void }) {
  const fixtures = useFixtureMode();
  return (
    <>
      {justPaid && (
        <Notice tone="positive" className="mb-3" title="Payment confirmed by our server. Pro is on.">
          Kora reported the order as paid, and SpendLens recorded it.
        </Notice>
      )}
      <Section
        title="You have SpendLens Pro"
        description={until ? `Active until ${formatDate(until)}.` : undefined}
        aside={<Status tone="brand">Pro</Status>}
      >
        <ProFeatures />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/insights/forecast">See your forecast</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/insights">Compare months</Link>
          </Button>
          {fixtures && (
            <Button
              variant="ghost"
              onClick={async () => {
                const { resetFixturePlan } = await import("@/lib/mock/server");
                resetFixturePlan();
                onEnded();
              }}
            >
              End Pro (sample mode)
            </Button>
          )}
        </div>
      </Section>
    </>
  );
}

export function ProScreen() {
  const me = useMe();
  const [justPaid, setJustPaid] = useState(false);
  const { reload } = me;
  // Stable, because CheckoutPanel runs it from an effect once the order settles as paid.
  const onPaid = useCallback(() => {
    setJustPaid(true);
    void reload();
  }, [reload]);
  return (
    <>
      <PageHeader
        title="SpendLens Pro"
        description="Free gives you the summary and scenarios to view. Pro adds the tools for keeping a plan going."
      />
      {me.error ? (
        <ErrorNotice error={me.error} onRetry={me.reload} />
      ) : !me.data ? (
        <ProSkeleton header={false} />
      ) : me.data.plan === "pro" ? (
        <div className="space-y-3">
          <ProActive
            until={me.data.pro_expires_at}
            justPaid={justPaid}
            onEnded={() => {
              setJustPaid(false);
              void me.reload();
            }}
          />
          <PlanComparison priceKobo={me.data.pro_price_kobo} days={me.data.pro_days} current="pro" />
        </div>
      ) : (
        <CheckoutPanel me={me.data} onPaid={onPaid} />
      )}
    </>
  );
}
