import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How SpendLens handles demo data and third-party AI inference.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Third-party AI providers",
    body: "When SpendLens generates a plain-language explanation for a scenario, inference runs through Groq (primary provider) with automatic failover to Google Gemini. Both are external API providers subject to their respective service terms.",
  },
  {
    title: "What AI providers never receive",
    body: "SpendLens calculates every total, cut, and protection rule in application code before any AI request runs. External AI providers receive only aggregate category totals, reduction percentages, and coverage warnings. Individual transaction rows, merchant descriptions, account balances, and user identifiers are never transmitted.",
  },
  {
    title: "Sample mode and data removal",
    body: "In sample mode, SpendLens runs locally in your browser on synthetic transactions and saves demo edits in browser storage, which you can clear at any time. Server-side persistence and account-level deletion are not active until the live backend service is deployed.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <article className="page py-16 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="text-[32px] font-[400] leading-[1.08] tracking-[-0.04em] text-balance sm:text-[44px]">
          Privacy notice
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-t3">
          SpendLens is currently running in demo mode with synthetic data. Below is how data flows across the app and
          its AI explanation layer.
        </p>

        <div className="mt-10 divide-y divide-line border-t border-b border-line">
          {sections.map((section) => (
            <section key={section.title} className="py-6">
              <h2 className="text-[16px] font-[600] tracking-[-0.01em]">{section.title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-t2">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-[14px] text-t3">
          <Link href="/" className="text-foreground underline decoration-line-strong underline-offset-4 hover:decoration-foreground">
            Back to SpendLens
          </Link>
        </p>
      </div>
    </article>
  );
}
