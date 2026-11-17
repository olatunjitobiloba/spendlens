"use client";

import { useState } from "react";
import { Csv02Icon, Delete02Icon, Pdf02Icon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Spinner } from "@/components/ui/spinner";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { ImportRecord } from "@/types/api";
import { formatRange } from "@/utils/format";
import { toastApiError } from "../shared/error-toast";
import { RowsSkeleton } from "../skeletons";

export function PastImports() {
  const analysis = useResource(() => api.analysis.get(), "imports");
  const [pending, setPending] = useState<ImportRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!analysis.data) {
    return analysis.loading ? (
      <Section title="Your imports" className="mt-6">
        <RowsSkeleton rows={2} />
      </Section>
    ) : null;
  }
  const imports = analysis.data.imports;
  if (!imports.length) return null;

  async function remove() {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.imports.remove(pending.id);
      await analysis.reload();
      setPending(null);
    } catch (e) {
      toastApiError(e, { title: `Couldn't delete ${pending.filename}`, onRetry: () => void remove() });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Section title="Your imports" description="Deleting an import also removes everything worked out from it." className="mt-6">
      <ul className="divide-y divide-line">
        {imports.map((imp) => (
          <li key={imp.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[13.5px]">
            <span className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon icon={imp.filename.toLowerCase().endsWith(".pdf") ? Pdf02Icon : Csv02Icon} className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{imp.filename}</span>
                <span className="text-[12.5px] text-t3">
                  {imp.row_count} rows{imp.date_range ? ` · ${formatRange(imp.date_range)}` : ""}
                </span>
              </span>
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPending(imp)}
            >
              <Icon icon={Delete02Icon} />
              Delete<span className="sr-only"> {imp.filename}</span>
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && !deleting && setPending(null)}>
        <AlertDialogContent className="rounded-[1.25rem] border border-line-strong bg-panel ring-0 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Icon icon={Delete02Icon} className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-[16px] font-[650]">Delete {pending?.filename}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px]">
              This removes its {pending?.row_count} transactions and everything worked out from them. It cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="rounded-b-[1.25rem] border-line bg-panel-raised/50">
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            {/* A plain button, so the dialog stays open until the delete finishes. */}
            <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={remove} disabled={deleting}>
              {deleting && <Spinner />}
              {deleting ? "Deleting…" : "Delete import"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
