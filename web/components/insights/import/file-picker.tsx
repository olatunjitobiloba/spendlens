"use client";

import { useState } from "react";
import {
  CloudUploadIcon,
  Csv02Icon,
  FileImportIcon,
  Loading03Icon,
  SparklesIcon,
  SquareLock02Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons";

import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { cn } from "@/utils/cn";

function Fact({ icon, children }: { icon: IconSvgElement; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-brand/15 bg-panel/80 px-2.5 py-1 text-[12px] text-t2">
      <Icon icon={icon} className="size-3.5 text-brand" />
      {children}
    </li>
  );
}

/** Drop zone plus a real file input, so it works by keyboard too. */
export function FilePicker({
  onFile,
  onTrySample,
  busy,
}: {
  onFile: (f: File) => void;
  onTrySample: () => void;
  busy: boolean;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f && !busy) onFile(f);
      }}
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-[1.5rem] border-2 border-dashed px-6 pt-12 pb-6 text-center transition-colors",
        drag
          ? "border-brand bg-brand/[0.08]"
          : "border-brand/25 bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_oklab,var(--brand)_9%,transparent),transparent_70%)]",
      )}
    >
      {/* Icon cluster: the upload tile with two file chips tilted behind it. */}
      <div aria-hidden="true" className="relative mb-5 h-16 w-48">
        <span className="absolute top-2 left-1 inline-flex size-12 -rotate-12 items-center justify-center rounded-2xl border border-brand/20 bg-panel text-brand shadow-sm">
          <Icon icon={Csv02Icon} className="size-6" />
        </span>
        <span className="absolute top-2 right-1 inline-flex size-12 rotate-12 items-center justify-center rounded-2xl border border-brand/20 bg-panel text-brand shadow-sm">
          <Icon icon={FileImportIcon} className="size-6" />
        </span>
        <span
          className={cn(
            "absolute left-1/2 inline-flex size-16 -translate-x-1/2 items-center justify-center rounded-[1.25rem] bg-brand text-white shadow-lg shadow-brand/30 transition-transform",
            drag && "-translate-y-1 scale-105",
          )}
        >
          <Icon
            icon={busy ? Loading03Icon : CloudUploadIcon}
            className={cn("size-8", busy && "animate-spin motion-reduce:animate-none")}
          />
        </span>
      </div>

      <p className="text-[17px] font-[650] tracking-[-0.02em]" aria-live="polite">
        {busy ? "Checking your file…" : drag ? "Drop it here" : "Drop a CSV here, or choose one"}
      </p>
      <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
        <Fact icon={Csv02Icon}>CSV only</Fact>
        <Fact icon={WeightScale01Icon}>Up to 5 MB</Fact>
        <Fact icon={SquareLock02Icon}>Nothing saved until you confirm</Fact>
      </ul>

      <label
        className={cn(
          "mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white shadow-md shadow-brand/25 transition-colors hover:bg-[#006ad3] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <Icon icon={FileImportIcon} />
        Choose CSV file
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>

      <div className="mt-8 flex w-full max-w-sm items-center gap-3 text-[12px] text-t4">
        <span className="h-px flex-1 bg-brand/15" />
        or
        <span className="h-px flex-1 bg-brand/15" />
      </div>
      <button
        type="button"
        onClick={onTrySample}
        disabled={busy}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-brand hover:bg-brand/[0.08] disabled:opacity-50"
      >
        <Icon icon={SparklesIcon} className="size-3.5" />
        No file handy? Try with sample data
      </button>
    </div>
  );
}
