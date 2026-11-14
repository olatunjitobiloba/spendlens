"use client";

import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown01Icon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  Search01Icon,
  SmartPhone01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { bankLogo } from "@/configs/banks";
import {
  BANK_APPS,
  BANK_GROUPS,
  DEFAULT_BANK,
  type BankApp,
} from "@/configs/bank-apps";
import { BEATS, SIM_STEPS, firstBeatOf } from "@/configs/integration";
import { cn } from "@/utils/cn";
import { DEVICES, type Device } from "./phone-frame";
import { SimPhone, useInView, useReducedMotion, useSimPlayer } from "./sim-phone";

function DeviceSwitch({
  device,
  onChange,
}: {
  device: Device;
  onChange: (d: Device) => void;
}) {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="text-[13px] font-medium text-t2">
        Phone
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel p-1"
      >
        {DEVICES.map((d) => {
          const active = d.id === device;
          return (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(d.id)}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150",
                active
                  ? "bg-foreground text-background"
                  : "text-t3 hover:text-foreground",
              )}
            >
              <Icon icon={SmartPhone01Icon} className="size-4" />
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BankSelect({
  bank,
  onChange,
}: {
  bank: BankApp;
  onChange: (slug: string) => void;
}) {
  return (
    <div>
      <label htmlFor="bank-select" className="text-[13px] font-medium text-t2">
        Bank app
      </label>
      <div className="relative mt-2">
        <Image
          src={bankLogo(bank)}
          alt=""
          width={22}
          height={22}
          className="pointer-events-none absolute top-1/2 left-3 size-[22px] -translate-y-1/2 rounded-md bg-white object-contain ring-1 ring-line"
        />
        <select
          id="bank-select"
          value={bank.slug}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-line-strong bg-panel pr-9 pl-11 text-[14px] text-foreground outline-none focus-visible:border-brand"
        >
          {BANK_GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {BANK_APPS.filter((b) => b.group === g).map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Icon
          icon={ArrowDown01Icon}
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-t3"
        />
      </div>
    </div>
  );
}

function BankList({
  bank,
  onChange,
}: {
  bank: BankApp;
  onChange: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());
  const matches = useMemo(
    () =>
      q
        ? BANK_APPS.filter((b) =>
            [b.name, b.short, b.code].some((v) => v.toLowerCase().includes(q)),
          )
        : BANK_APPS,
    [q],
  );

  return (
    <div>
      <label htmlFor="bank-search" className="text-[13px] font-medium text-t2">
        Bank app
      </label>
      <div className="panel mt-2 overflow-hidden">
        <div className="relative border-b border-line">
          <Icon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-t4"
          />
          <input
            id="bank-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${BANK_APPS.length} banks`}
            autoComplete="off"
            className="h-11 w-full bg-transparent pr-3 pl-9 text-[13.5px] outline-none placeholder:text-t4"
          />
        </div>
        <div className="max-h-[440px] overflow-y-auto overscroll-contain py-1">
          {matches.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-t3">
              No bank matches “{query}”.
            </p>
          )}
          {BANK_GROUPS.map((g) => {
            const items = matches.filter((b) => b.group === g);
            if (items.length === 0) return null;
            return (
              <div key={g} role="group" aria-label={g}>
                <p className="px-3 pt-3 pb-1 text-[12px] text-t4">{g}</p>
                {items.map((b) => {
                  const active = b.slug === bank.slug;
                  return (
                    <button
                      key={b.slug}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange(b.slug)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13.5px] transition-colors duration-100",
                        active
                          ? "bg-foreground/[0.05] text-foreground"
                          : "text-t2 hover:bg-foreground/[0.03]",
                      )}
                    >
                      <Image
                        src={bankLogo(b)}
                        alt=""
                        width={22}
                        height={22}
                        className="size-[22px] shrink-0 rounded-md bg-white object-contain ring-1 ring-line"
                      />
                      <span className="flex-1 truncate">{b.name}</span>
                      {active && (
                        <Icon
                          icon={Tick02Icon}
                          className="size-4 text-brand"
                          strokeWidth={2}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepList({
  step,
  onSelect,
}: {
  step: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {SIM_STEPS.map((s, i) => {
        const active = i === step;
        return (
          <li key={s.title}>
            <button
              type="button"
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(i)}
              className="group relative grid w-full grid-cols-[1.5rem_1fr] gap-x-3 py-4 text-left"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-4 bottom-4 -left-px w-0.5 rounded-full transition-colors duration-300",
                  active ? "bg-brand" : "bg-transparent",
                )}
              />
              <span
                className={cn(
                  "pl-3 font-mono text-[13px] tabular-nums transition-colors",
                  active ? "text-brand" : "text-t4",
                )}
              >
                {i + 1}
              </span>
              <span>
                <span
                  className={cn(
                    "block text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-300",
                    active ? "text-foreground" : "text-t3 group-hover:text-t2",
                  )}
                >
                  {s.title}
                </span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-t3">
                  {s.description}
                </span>
                <code className="mt-2 block font-mono text-[12px] text-t4">
                  {s.endpoint}
                </code>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function IntegrationSimulator() {
  const [device, setDevice] = useState<Device>("iphone");
  const [slug, setSlug] = useState(DEFAULT_BANK);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);

  const reduced = useReducedMotion();
  const playing = userPlaying ?? !reduced;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const [beat, setBeat] = useSimPlayer(playing && inView);

  const bank = BANK_APPS.find((b) => b.slug === slug) ?? BANK_APPS[0];
  const step = BEATS[beat].step;

  const selectBank = (next: string) => {
    setSlug(next);
    setBeat(0);
  };

  return (
    // Laid out by container width, not viewport, so it fits next to the insights sidebar.
    <div ref={rootRef} className="@container">
      <div className="grid items-start gap-x-10 gap-y-8 @3xl:grid-cols-[auto_minmax(0,1fr)] @5xl:grid-cols-[260px_auto_minmax(0,1fr)]">
        <aside className="sticky top-8 hidden space-y-6 @5xl:block">
          <DeviceSwitch device={device} onChange={setDevice} />
          <BankList bank={bank} onChange={selectBank} />
        </aside>

        <div className="grid gap-4 @lg:grid-cols-2 @3xl:col-span-2 @5xl:hidden">
          <DeviceSwitch device={device} onChange={setDevice} />
          <BankSelect bank={bank} onChange={selectBank} />
        </div>

        <figure className="flex flex-col items-center">
          <figcaption className="sr-only">
            An animated {DEVICES.find((d) => d.id === device)?.label} showing the {bank.name} app with SpendLens built in.
            Step {step + 1} of {SIM_STEPS.length}: {SIM_STEPS[step].title}. The steps are also listed in text next to the
            phone.
          </figcaption>

          {/* Below 360px the phone is scaled down; the outer box reserves the scaled size so nothing overflows. */}
          <div aria-hidden="true" className="max-[359px]:h-[598px] max-[359px]:w-[282px]">
            <div className="max-[359px]:origin-top-left max-[359px]:scale-[0.88]">
              <SimPhone device={device} bank={bank} beat={beat} />
            </div>
          </div>

          <div className="mt-6 flex w-full max-w-[318px] items-center justify-between gap-3">
            <p className="text-[13px] text-t3 tabular-nums">
              Step {step + 1} of {SIM_STEPS.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setUserPlaying(!playing)}
                aria-label={playing ? "Pause the walkthrough" : "Play the walkthrough"}
              >
                <Icon icon={playing ? PauseIcon : PlayIcon} />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => setBeat(0)} aria-label="Start the walkthrough again">
                <Icon icon={RepeatIcon} />
              </Button>
            </div>
          </div>
        </figure>

        <div className="min-w-0 @3xl:pt-2">
          <h2 className="text-[18px] font-semibold tracking-[-0.025em]">What {bank.short} customers would see</h2>
          <p className="mt-1.5 mb-5 max-w-md text-[14px] leading-relaxed text-t3">
            Five screens, built with your own components. Pick a step to jump to it.
          </p>
          <StepList step={step} onSelect={(i) => setBeat(firstBeatOf(i))} />
        </div>
      </div>
    </div>
  );
}
