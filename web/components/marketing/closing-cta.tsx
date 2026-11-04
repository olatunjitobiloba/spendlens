import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { GithubLogo } from "@/components/brand/github-logo";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { closing } from "@/configs/marketing";
import { siteConfig } from "@/configs/site";

export function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="page pt-8 pb-24 sm:pb-32">
      <div className="panel relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="dot-field" aria-hidden="true" />
        <div className="relative flex flex-col items-center">
          <LogoMark size={44} />
          <h2
            id="cta-title"
            className="mt-7 max-w-xl text-[32px] font-[400] leading-[1.05] tracking-[-0.045em] text-balance sm:text-[48px]"
          >
            {closing.title}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-t3 text-balance">
            {closing.description}
          </p>
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={siteConfig.links.demo}>
                Open the demo
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                <GithubLogo />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
