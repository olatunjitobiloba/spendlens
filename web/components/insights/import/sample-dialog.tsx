"use client";

import {
  Csv02Icon,
  Download04Icon,
  LeftToRightListBulletIcon,
  SparklesIcon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { SAMPLE_CSV_URL } from "@/lib/sample";

/** "No file handy?" as a popup: run the sample statement, or see the file format. */
export function SampleDialog({
  open,
  onOpenChange,
  onUseSample,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseSample: () => void;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-[1.5rem] border border-line-strong bg-panel p-0 ring-0 sm:max-w-md">
        <div className="bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--brand)_12%,transparent),transparent_75%)] px-6 pt-7 pb-5">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <Icon icon={TestTube01Icon} className="size-6" />
          </span>
          <DialogHeader className="mt-4 gap-1.5">
            <DialogTitle className="text-[19px] font-[650] tracking-[-0.02em]">No file handy?</DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-t3">
              Use three months of synthetic transactions. It goes through the same checks as a real file.
            </DialogDescription>
          </DialogHeader>
          <Button size="lg" className="mt-5 w-full shadow-md shadow-brand/25" onClick={onUseSample} disabled={busy}>
            {busy ? <Spinner /> : <Icon icon={SparklesIcon} />}
            {busy ? "Loading sample data…" : "Try with sample data"}
          </Button>
        </div>

        <div className="border-t border-line px-6 pt-5 pb-6">
          <h3 className="flex items-center gap-2 text-[13.5px] font-[600]">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Icon icon={Csv02Icon} className="size-4" />
            </span>
            File format
          </h3>
          <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-t3">
            <Icon icon={LeftToRightListBulletIcon} className="size-3.5 text-brand" />
            One row per transaction, with a header row:
          </p>
          <code className="mt-2 block overflow-x-auto rounded-xl border border-brand/15 bg-brand/[0.05] px-3 py-2.5 font-mono text-[11.5px] text-t2">
            date,description,amount_kobo,direction,account,bank
          </code>
          <a
            href={SAMPLE_CSV_URL}
            download
            className="mt-4 inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium text-brand underline-offset-4 hover:underline"
          >
            <Icon icon={Download04Icon} />
            Download the sample CSV
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
