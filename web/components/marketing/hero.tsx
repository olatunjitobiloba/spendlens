import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { hero } from "@/configs/marketing";
import { siteConfig } from "@/configs/site";
import { ScenarioPreview } from "./visuals/scenario-preview";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="dot-field" aria-hidden="true" />
      <div className="page relative flex flex-col items-center pt-12 pb-12 text-center sm:pt-20 sm:pb-16">
        <h1
          id="hero-title"
          className="max-w-3xl text-[40px] font-[350] leading-[1.02] tracking-[-0.045em] text-balance sm:text-[64px]"
        >
          {hero.title}
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-t3 text-balance sm:text-base">
          {hero.description}
        </p>
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={siteConfig.links.demo}>
              Try it with sample data
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <a href={siteConfig.links.docs} target="_blank" rel="noopener noreferrer">
              Read the API docs
            </a>
          </Button>
        </div>
      </div>

      <div className="page relative pb-6">
        <ScenarioPreview />
      </div>
    </section>
  );
}
