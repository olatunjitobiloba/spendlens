import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

// Page-shaped placeholders. Each mirrors the layout of the screen it stands in
// for, so nothing jumps when the data lands. Used by the route loading.tsx
// files, the Suspense fallbacks, and each screen while its first fetch runs.

function Live({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-[1.25rem] border border-line bg-panel p-4 sm:p-5", className)}>{children}</div>;
}

export function PageHeaderSkeleton({ aside = false }: { aside?: boolean }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="w-full max-w-md space-y-2.5">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      {aside && <Skeleton className="h-9 w-40 rounded-full" />}
    </div>
  );
}

function PanelTitle({ wide = false }: { wide?: boolean }) {
  return (
    <div className="mb-5 space-y-2">
      <Skeleton className={cn("h-4", wide ? "w-48" : "w-32")} />
      <Skeleton className="h-3 w-56 max-w-full" />
    </div>
  );
}

/** Rows of a list or table: a short cell, a long one, and a value on the right. */
export function RowsSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-line", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-3.5 w-12 shrink-0" />
          <Skeleton className="size-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5" style={{ width: `${45 + ((i * 17) % 35)}%` }} />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-8 w-36 rounded-lg sm:block" />
          <Skeleton className="h-3.5 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <Panel className={className}>
      <PanelTitle />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-5" style={{ width: `${100 - ((i * 13) % 30)}%` }} />
        ))}
      </div>
    </Panel>
  );
}

function StatTileSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="size-4 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

function BarsSkeleton() {
  const heights = [62, 48, 80, 55, 92, 70];
  return (
    <div className="mt-6 flex h-48 items-end justify-around gap-3 px-2">
      {heights.map((h, i) => (
        <div key={i} className="flex h-full max-w-20 flex-1 flex-col items-center justify-end gap-2">
          <Skeleton className="w-full rounded-t-lg rounded-b-none" style={{ height: `calc(${h}% - 1.5rem)` }} />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <Live label="Loading your summary">
      <PageHeaderSkeleton aside />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatTileSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.65fr_1fr]">
          <Panel>
            <PanelTitle />
            <Skeleton className="h-7 w-40" />
            <BarsSkeleton />
          </Panel>
          <Panel>
            <PanelTitle />
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
            <Skeleton className="mt-4 h-9 rounded-full" />
          </Panel>
        </div>
        <div className="grid items-start gap-3 lg:grid-cols-[1.65fr_1fr]">
          <Panel>
            <PanelTitle />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-1.5 rounded-full" />
                </div>
              ))}
            </div>
          </Panel>
          <div className="grid gap-3">
            <SectionSkeleton rows={3} />
            <SectionSkeleton rows={3} />
          </div>
        </div>
      </div>
    </Live>
  );
}

export function ImportSkeleton() {
  return (
    <Live label="Loading import">
      <PageHeaderSkeleton />
      <div className="mb-5 flex gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center rounded-[1.25rem] border border-dashed border-line-strong px-6 py-12">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="mt-4 h-4 w-56" />
        <Skeleton className="mt-2 h-3 w-72 max-w-full" />
        <Skeleton className="mt-5 h-11 w-40 rounded-full" />
      </div>
      <Panel className="mt-6">
        <PanelTitle />
        <RowsSkeleton rows={2} />
      </Panel>
    </Live>
  );
}

export function ReviewTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-44 rounded-full" />
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 min-w-48 flex-1 rounded-full" />
      </div>
      <RowsSkeleton rows={rows} />
    </>
  );
}

export function ReviewSkeleton() {
  return (
    <Live label="Loading your transactions">
      <PageHeaderSkeleton />
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Panel key={i}>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2.5 h-6 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Panel>
        ))}
      </div>
      <Skeleton className="mb-3 h-10 w-80 max-w-full rounded-full" />
      <Panel>
        <ReviewTableSkeleton />
      </Panel>
    </Live>
  );
}

function ToggleRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5" style={{ width: `${7 + ((i * 3) % 5)}rem` }} />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PlanSkeleton() {
  return (
    <Live label="Loading your plan">
      <PageHeaderSkeleton aside />
      <div className="grid items-start gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Panel>
          <PanelTitle />
          <ToggleRowsSkeleton rows={7} />
        </Panel>
        <Panel>
          <PanelTitle />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-5 flex justify-center">
        <Skeleton className="h-11 w-52 rounded-full" />
      </div>
    </Live>
  );
}

export function ProSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Live label="Checking your plan">
      {header && <PageHeaderSkeleton />}
      <div className="grid items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-0 sm:p-0">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b border-line p-5">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="divide-y divide-line px-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-4 py-3.5">
                <Skeleton className="h-3.5" style={{ width: `${55 + ((i * 11) % 35)}%` }} />
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="size-5 rounded-full" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelTitle />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="mt-3 h-11 rounded-full" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-2/3" />
        </Panel>
      </div>
    </Live>
  );
}

export function ForecastGridSkeleton() {
  return (
    <Panel>
      <PanelTitle wide />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line p-4">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-6 w-28" />
            <Skeleton className="mt-2 h-3 w-40" />
            <Skeleton className="mt-5 h-3 w-24" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RecurringSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForecastSkeleton() {
  return (
    <Live label="Loading forecast">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <ForecastGridSkeleton />
        <Panel>
          <PanelTitle />
          <RecurringSkeleton />
        </Panel>
      </div>
    </Live>
  );
}
