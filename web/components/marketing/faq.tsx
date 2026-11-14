import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/configs/marketing";
import { siteConfig } from "@/configs/site";
import { SectionHeading } from "./section-heading";

export function Faq() {
  return (
    <section aria-labelledby="faq-title" id="faq" className="page py-20 sm:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <div>
          <SectionHeading id="faq-title" title="Common questions" />
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-t3">
            Something missing?{" "}
            <a
              href={`${siteConfig.links.github}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Open an issue on GitHub
            </a>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="border-t border-line">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="border-b border-line">
              <AccordionTrigger className="rounded-none py-5 text-[15.5px] font-medium hover:no-underline hover:text-foreground [&_[data-slot=accordion-trigger-icon]]:mt-0.5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[14.5px] leading-relaxed text-t3">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
