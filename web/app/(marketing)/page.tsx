import { ClosingCta } from "@/components/marketing/closing-cta";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { Steps } from "@/components/marketing/steps";
import { WhySpendLens } from "@/components/marketing/why-spendlens";
import { marketingJsonLd, toJsonLd } from "@/utils/seo";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(marketingJsonLd()) }}
      />
      <Hero />
      <WhySpendLens />
      <Steps />
      <Faq />
      <ClosingCta />
    </>
  );
}
