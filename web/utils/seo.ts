import { faqs } from "@/configs/marketing";
import { siteConfig } from "@/configs/site";

export function marketingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: "en-NG",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#app`,
        name: siteConfig.name,
        url: siteConfig.url,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: siteConfig.description,
        sameAs: [siteConfig.links.github],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

/** Serialise JSON-LD safely for a <script> tag. */
export function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
