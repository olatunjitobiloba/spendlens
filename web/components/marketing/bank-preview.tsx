"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { SimPhone, useInView, useReducedMotion, useSimPlayer } from "@/components/integration/sim-phone";
import type { Device } from "@/components/integration/phone-frame";
import { Button } from "@/components/ui/button";
import { BANK_APPS } from "@/configs/bank-apps";
import { bankLogo } from "@/configs/banks";
import { BEATS, SIM_STEPS } from "@/configs/integration";
import { bankPreview } from "@/configs/marketing";
import { cn } from "@/utils/cn";
import { SectionHeading } from "./section-heading";

const banks = bankPreview.banks.map((slug) => BANK_APPS.find((b) => b.slug === slug)!);

/**
 * A self-playing version of the bank simulator for the home page. Each loop
 * moves to the next bank and swaps between the two phones.
 */
export function BankPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [loop, setLoop] = useState(0);
  const reduced = useReducedMotion();
  const inView = useInView(rootRef);
  const nextLoop = useCallback(() => setLoop((n) => n + 1), []);
  const [beat, setBeat] = useSimPlayer(inView && !reduced, nextLoop);

  const bank = banks[loop % banks.length];
  const device: Device = loop % 2 === 0 ? "iphone" : "samsung";
  const step = BEATS[beat].step;

  const pick = (i: number) => {
    // Jump to the chosen bank on the next loop index that shows it.
    setLoop((n) => n - (n % banks.length) + i);
    setBeat(0);
  };

  return (
    <section aria-labelledby="banks-title" id="banks" className="page py-20 sm:py-28">
      <div
        ref={rootRef}
        className="grid overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-panel md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
      >
        <div className="flex flex-col p-7 sm:p-10">
          <SectionHeading id="banks-title" title={bankPreview.title} description={bankPreview.description} />

          <div className="mt-8">
            <p className="text-[13px] text-t3">
              Showing <span className="font-medium text-foreground">{bank.name}</span> on{" "}
              {device === "iphone" ? "iPhone 18" : "Samsung S26"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {banks.map((b, i) => {
                const active = b.slug === bank.slug;
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => pick(i)}
                    aria-pressed={active}
                    aria-label={`Show ${b.name}`}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl border bg-white transition-[border-color,opacity] duration-200",
                      active ? "border-foreground/40 opacity-100" : "border-line opacity-55 hover:opacity-100",
                    )}
                  >
                    <Image src={bankLogo(b)} alt="" width={28} height={28} className="size-7 rounded-md object-contain" />
                  </button>
                );
              })}
            </div>
          </div>

          <ol className="mt-8 space-y-2.5 md:mt-auto md:pt-10">
            {SIM_STEPS.map((s, i) => (
              <li
                key={s.title}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex items-baseline gap-3 text-[14.5px] transition-colors duration-300",
                  i === step ? "text-foreground" : "text-t4",
                )}
              >
                <span className="font-mono text-[12px] tabular-nums">{i + 1}</span>
                {s.title}
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/insights/banks">
                Try it with all {BANK_APPS.length} banks
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </div>

        <figure className="flex items-center justify-center border-t border-line bg-panel-raised/50 px-6 py-10 md:border-t-0 md:border-l">
          <figcaption className="sr-only">
            An animated phone showing SpendLens inside the {bank.name} app. Current step: {SIM_STEPS[step].title}.
          </figcaption>
          {/* Scaled to 82%; the outer box reserves the scaled size so the card keeps its height. */}
          <div aria-hidden="true" className="flex h-[556px] w-[277px] justify-center">
            <div className="origin-top scale-[0.82]">
              <SimPhone device={device} bank={bank} beat={beat} />
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
