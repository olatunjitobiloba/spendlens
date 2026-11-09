"use client";

import { useState } from "react";
import { FileUploadIcon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/utils/cn";

/** Drop zone plus a real file input, so it works by keyboard too. */
export function FilePicker({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
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
        "flex flex-col items-center rounded-[1.25rem] border border-dashed px-6 py-10 text-center transition-colors",
        drag ? "border-brand bg-brand/[0.05]" : "border-line-strong",
      )}
    >
      <span className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-foreground/[0.05] text-t3">
        <Icon icon={FileUploadIcon} className="size-5" />
      </span>
      <p className="text-[15px] font-[600]">Drop a CSV here, or choose one</p>
      <p className="mt-1 text-[13px] text-t3">CSV only, up to 5 MB. Nothing is saved until you confirm.</p>
      <label
        className={cn(
          "mt-4 inline-flex h-11 cursor-pointer items-center rounded-full border border-line-strong bg-panel px-5 text-sm font-medium text-t2 hover:border-foreground/25 hover:text-foreground has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
          busy && "pointer-events-none opacity-50",
        )}
      >
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
    </div>
  );
}
