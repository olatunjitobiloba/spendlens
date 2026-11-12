const fallbackUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const siteConfig = {
  name: "SpendLens",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl,
  title: "SpendLens · Spending review API for banks and fintech apps",
  shortDescription: "Know what you can cut before you cut it.",
  description:
    "SpendLens is an API-first spending review for banks and fintech apps. Import transactions, protect essential costs and test a savings plan. Code does every calculation. AI only explains the result.",
  keywords: [
    "spending review API",
    "personal finance API",
    "fintech API Nigeria",
    "open banking insights",
    "transaction categorisation",
    "savings scenario",
    "budget planner",
    "bank embedded finance",
    "Kora Checkout",
  ],
  locale: "en_NG",
  links: {
    github: "https://github.com/olatunjitobiloba/spendlens",
    demo: "/insights",
    docs: "https://github.com/olatunjitobiloba/spendlens#readme",
  },
  footerNote:
    "Calculations run in code and AI only writes the explanations. All demo data is synthetic.",
} as const;

export type SiteConfig = typeof siteConfig;
