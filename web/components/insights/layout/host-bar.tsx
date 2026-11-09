import { ThemeToggle } from "@/components/theme/theme-toggle";
import { hostNav } from "@/configs/insights";

/** Neutral fictional host app. Not modelled on any real bank (PRD §2). */
function PartnerBankMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-flex size-7 items-center justify-center rounded-lg bg-foreground text-[11px] font-[700] tracking-[-0.02em] text-background"
      >
        PB
      </span>
      <span className="text-[15px] font-[650] tracking-[-0.02em]">Partner Bank</span>
    </span>
  );
}

export function HostBar() {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <PartnerBankMark />
        <nav aria-label="Partner Bank" className="hidden flex-1 items-center gap-1 md:flex">
          {hostNav.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title="Not part of this demo"
              className="rounded-full px-3 py-1.5 text-[13px] text-t4"
            >
              {label}
            </span>
          ))}
          <span aria-current="page" className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-[13px] font-medium">
            Money Insights
          </span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[12px] text-t4 sm:inline">Demo host app</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
