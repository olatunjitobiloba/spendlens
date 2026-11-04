import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { footerNav } from "@/configs/navigation";
import { siteConfig } from "@/configs/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="page flex flex-col gap-6 py-10 text-[13px] text-t3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <Link href="/" aria-label="SpendLens home" className="w-fit rounded-full text-foreground">
            <Logo />
          </Link>
          <p>{siteConfig.footerNote}</p>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-5">
          {footerNav.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
