import type { Metadata } from "next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { IntegrationSimulator } from "@/components/integration/integration-simulator";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { BANK_APPS } from "@/configs/bank-apps";
import { siteConfig } from "@/configs/site";

export const metadata: Metadata = {
  title: "For banks",
  description:
    "See how SpendLens fits inside a Nigerian bank's mobile app. Pick a phone and any commercial, merchant, non-interest or microfinance bank, and watch a customer use it.",
  alternates: { canonical: "/banks" },
};

const facts = [
  {
    title: "Your design, our maths",
    body: "SpendLens sends back numbers and plain-language text, never screens. Your team draws them with the components your app already uses.",
  },
  {
    title: "Customers stay in your app",
    body: "There is no redirect and no second login. Insights sit next to Transfer and Bills, and the customer never leaves your brand.",
  },
  {
    title: "A small surface to build",
    body: "Five REST endpoints with an OpenAPI file cover the whole flow. Most teams start with the analysis call and add plans later.",
  },
] as const;

export default function BanksPage() {
  return (
    <>
      <section aria-labelledby="banks-title" className="page pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-2xl">
          <h1
            id="banks-title"
            className="text-[36px] font-[350] leading-[1.04] tracking-[-0.045em] text-balance sm:text-[56px]"
          >
            See SpendLens inside your bank&apos;s app
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-t3 text-balance sm:text-base">
            Pick a phone and one of {BANK_APPS.length} Nigerian banks, then watch a customer open their spending, protect
            their bills and save a plan, all without leaving the bank&apos;s app. The bank screens are close
            approximations for illustration.
          </p>
        </div>

        <div className="mt-12 sm:mt-16">
          <IntegrationSimulator />
        </div>
      </section>

      <section aria-labelledby="fit-title" className="page border-t border-line py-20 sm:py-28">
        <SectionHeading
          id="fit-title"
          title="Built to fit inside your product"
          description="You keep the customer relationship and the interface. SpendLens does the categorising, the protections and the maths."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
          {facts.map((f) => (
            <div key={f.title} className="bg-panel p-7 sm:p-8">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-t3">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild variant="outline" size="lg">
            <a href={siteConfig.links.docs} target="_blank" rel="noopener noreferrer">
              Read the API docs
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </a>
          </Button>
        </div>
      </section>

      <ClosingCta />
    </>
  );
}
