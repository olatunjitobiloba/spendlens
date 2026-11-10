import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import type { ApiError } from "@/lib/api";
import type { ImportPreview } from "@/types/api";
import { formatDate, formatRange } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

function Stats({ preview }: { preview: ImportPreview }) {
  return (
    <Section title={preview.filename} description="Checked. Nothing has been saved yet.">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px] sm:grid-cols-4">
        <div>
          <dt className="text-t3">Rows found</dt>
          <dd className="font-mono text-[18px] tabular-nums">{preview.row_count}</dd>
        </div>
        <div>
          <dt className="text-t3">Ready to import</dt>
          <dd className="font-mono text-[18px] tabular-nums">{preview.valid_count}</dd>
        </div>
        <div>
          <dt className="text-t3">Date range</dt>
          <dd>{preview.date_range ? formatRange(preview.date_range) : "None"}</dd>
        </div>
        <div>
          <dt className="text-t3">Accounts</dt>
          <dd>{preview.accounts.length ? preview.accounts.join(", ") : "None"}</dd>
        </div>
      </dl>
    </Section>
  );
}

function RowErrors({ preview }: { preview: ImportPreview }) {
  const bad = preview.errors.length;
  if (!bad) return null;
  return (
    <Section
      title={`${bad} row${bad === 1 ? "" : "s"} could not be read`}
      description={
        preview.valid_count
          ? "These rows will be skipped. Fix them in the file and import it again if you need them."
          : "No rows can be imported. Fix the file and choose it again."
      }
      aside={<Status tone="warn">Check these lines</Status>}
    >
      <div className="max-h-64 overflow-auto rounded-xl border border-line" tabIndex={0} aria-label="Row errors">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-panel-raised text-t3">
            <tr>
              <th scope="col" className="w-20 px-3 py-2 font-medium">Line</th>
              <th scope="col" className="px-3 py-2 font-medium">Problem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {preview.errors.map((e) => (
              <tr key={`${e.line}-${e.message}`}>
                <td className="px-3 py-2 font-mono tabular-nums">{e.line}</td>
                <td className="px-3 py-2">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function FirstRows({ preview }: { preview: ImportPreview }) {
  if (!preview.sample_rows.length) return null;
  return (
    <Section title="First rows" description="How SpendLens read the file.">
      <div className="overflow-x-auto" tabIndex={0} aria-label="First rows of the file">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="text-t3">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-medium">Date</th>
              <th scope="col" className="py-2 pr-3 font-medium">Description</th>
              <th scope="col" className="py-2 pr-3 font-medium">Category</th>
              <th scope="col" className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {preview.sample_rows.map((r, i) => (
              <tr key={i}>
                <td className="py-2 pr-3 whitespace-nowrap text-t3">{formatDate(r.date)}</td>
                {/* Rendered as text, never HTML (technical doc §13). */}
                <td className="py-2 pr-3">{r.description}</td>
                <td className="py-2 pr-3">{r.category ?? <Status tone="warn">Needs review</Status>}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  {r.direction === "credit" ? "+" : ""}
                  <Money kobo={r.amount_kobo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function PreviewView({
  preview,
  onConfirm,
  onBack,
  busy,
  error,
}: {
  preview: ImportPreview;
  onConfirm: () => void;
  onBack: () => void;
  busy: boolean;
  error: ApiError | null;
}) {
  const n = preview.valid_count;
  return (
    <div className="space-y-3">
      <Stats preview={preview} />
      <RowErrors preview={preview} />
      {preview.coverage_warnings.map((w) => (
        <Notice key={w} tone="warn" title="Gap in your data">
          {w} Totals for that stretch will be lower than real life.
        </Notice>
      ))}
      <FirstRows preview={preview} />
      {error && <ErrorNotice error={error} onRetry={onConfirm} />}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          Choose a different file
        </Button>
        <Button size="lg" onClick={onConfirm} disabled={busy || n === 0}>
          {busy && <Spinner />}
          {busy ? "Importing…" : `Import ${n} row${n === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
