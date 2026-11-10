"use client";

import { useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

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
import { Spinner } from "@/components/ui/spinner";
import { asApiError } from "@/hooks/use-resource";
import { api, type ApiError } from "@/lib/api";
import { ErrorNotice } from "./error-notice";

/** Controlled, so a menu item can open it after the menu itself closes. */
export function DeleteDataDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteMyData();
      onOpenChange(false);
      // Screens hold their own data; a full load guarantees nothing stale stays visible.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/insights?deleted=1");
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return;
        onOpenChange(o);
        if (!o) setError(null);
      }}
    >
      <AlertDialogContent className="rounded-[1.25rem] border border-line-strong bg-panel ring-0 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Icon icon={Delete02Icon} className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-[16px] font-[650]">Delete all your financial data?</AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px]">
            This removes every import, transaction, correction, protection and scenario. It cannot be undone. Your Pro
            access, if any, is kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <ErrorNotice error={error} />}
        <AlertDialogFooter className="rounded-b-[1.25rem] border-line bg-panel-raised/50">
          <AlertDialogCancel disabled={busy}>Keep my data</AlertDialogCancel>
          <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={confirm} disabled={busy}>
            {busy && <Spinner />}
            {busy ? "Deleting…" : "Delete everything"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
