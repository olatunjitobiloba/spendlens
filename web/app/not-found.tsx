import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Footer } from "@/components/marketing/footer";
import { Header } from "@/components/marketing/header";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/configs/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="relative flex flex-1 items-center overflow-hidden">
        <div className="dot-field" aria-hidden="true" />
        <div className="page relative flex flex-col items-center py-24 text-center sm:py-32">
          <p
            aria-hidden="true"
            className="text-[104px] leading-none font-[650] tracking-[-0.06em] text-t4 sm:text-[168px]"
          >
            404
          </p>
          <h1 className="mt-6 text-[30px] font-[400] tracking-[-0.04em] sm:text-[40px]">
            This page isn&apos;t in the statement.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-t3 text-balance">
            The link may be old, or the page may not be built yet. Nothing was charged and nothing
            was saved.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`${siteConfig.links.github}/issues`} target="_blank" rel="noopener noreferrer">
                Report a broken link
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
