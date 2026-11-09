"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";

import { Button } from "@/components/ui/button";
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
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setError(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] border border-line-strong bg-panel p-5 shadow-2xl">
          <Dialog.Title className="text-[17px] font-[650] tracking-[-0.02em]">Delete all your financial data?</Dialog.Title>
          <Dialog.Description className="mt-2 text-[13.5px] text-t3">
            This removes every import, transaction, correction, protection and scenario. It cannot be undone. Your Pro
            access, if any, is kept.
          </Dialog.Description>
          {error && <ErrorNotice error={error} className="mt-4" />}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={busy}>
                Keep my data
              </Button>
            </Dialog.Close>
            <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={confirm} disabled={busy}>
              {busy ? "Deleting…" : "Delete everything"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
