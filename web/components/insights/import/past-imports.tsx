"use client";

import { useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { asApiError, useResource } from "@/hooks/use-resource";
import { api, type ApiError } from "@/lib/api";
import type { ImportRecord } from "@/types/api";
import { formatRange } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

export function PastImports() {
  const analysis = useResource(() => api.analysis(), "imports");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const imports = analysis.data?.imports ?? [];
  if (!imports.length) return null;

  async function remove(imp: ImportRecord) {
    if (!window.confirm(`Delete ${imp.filename} and its ${imp.row_count} transactions? This cannot be undone.`)) return;
    setDeleting(imp.id);
    setError(null);
    try {
      await api.deleteImport(imp.id);
      await analysis.reload();
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Section title="Your imports" description="Deleting an import also removes everything worked out from it." className="mt-6">
      {error && <ErrorNotice error={error} className="mb-3" />}
      <ul className="divide-y divide-line">
        {imports.map((imp) => (
          <li key={imp.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[13.5px]">
            <span className="min-w-0">
              <span className="block truncate font-medium">{imp.filename}</span>
              <span className="text-[12.5px] text-t3">
                {imp.row_count} rows{imp.date_range ? ` · ${formatRange(imp.date_range)}` : ""}
              </span>
            </span>
            <Button variant="destructive" size="sm" onClick={() => remove(imp)} disabled={deleting === imp.id}>
              <Icon icon={Delete02Icon} />
              {deleting === imp.id ? "Deleting…" : `Delete ${imp.filename}`}
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
