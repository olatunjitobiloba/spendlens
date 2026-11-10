"use client";

import Link from "next/link";
import { Crown02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useIsPro, useMe } from "@/providers/me-provider";
import { formatMonth } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";
import { ForecastGridSkeleton } from "../skeletons";
import { ForecastCard } from "./forecast-card";
import { RecurringList } from "./recurring-list";

function ForecastGrid() {
  const forecast = useResource(() => api.forecast(), "forecast");
  if (forecast.error) return <ErrorNotice error={forecast.error} onRetry={forecast.reload} />;
  if (!forecast.data) return <ForecastGridSkeleton />;
  const f = forecast.data;
  if (!f.categories.length) {
    return (
      <EmptyState
        title="Nothing to forecast yet"
        action={
          <Button asChild>
            <Link href="/insights/import">Import transactions</Link>
          </Button>
        }
      >
        A forecast needs at least three months of spending.
      </EmptyState>
    );
  }
  return (
    <Section
      title={`Next month: ${formatMonth(f.month)}`}
      description="Ranges, not promises. Where history is thin, SpendLens says so instead of guessing."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {f.categories.map((row) => (
          <ForecastCard key={row.category} row={row} />
        ))}
      </ul>
    </Section>
  );
}

export function ForecastScreen() {
  const isPro = useIsPro();
  const me = useMe();
  return (
    <>
      <PageHeader title="Forecast and repeat payments" description="What next month may look like, and what keeps coming back." />
      <div className="space-y-3">
        {me.loading && !me.data ? (
          <ForecastGridSkeleton />
        ) : isPro ? (
          <ForecastGrid />
        ) : (
          <EmptyState
            icon={Crown02Icon}
            title="Forecasts are part of Pro"
            action={
              <Button asChild>
                <Link href="/insights/pro">Unlock Pro</Link>
              </Button>
            }
          >
            See a likely range for each category next month, with the method shown and an honest “not enough data” where
            history is thin.
          </EmptyState>
        )}
        <RecurringList />
      </div>
    </>
  );
}
