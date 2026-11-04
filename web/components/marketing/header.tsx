import Link from "next/link";
import { GithubLogo } from "@/components/brand/github-logo";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/configs/navigation";
import { siteConfig } from "@/configs/site";

function NavLinks() {
  return (
    <nav
      aria-label="Main"
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-panel p-1"
    >
      {mainNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium text-t3 transition-colors duration-150 hover:text-foreground"
        >
          <span className="relative block h-[1.25em] overflow-hidden leading-[1.25em]">
            <span className="block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
              {item.label}
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-full block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full"
            >
              {item.label}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="page grid h-16 grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="SpendLens home" className="justify-self-start rounded-full">
          <Logo />
        </Link>

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SpendLens on GitHub"
            className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-panel text-t3 transition-colors duration-150 hover:border-line-strong hover:text-foreground"
          >
            <GithubLogo />
          </a>
          <ThemeToggle />
          <Button asChild className="hidden sm:inline-flex">
            <Link href={siteConfig.links.demo}>Try the demo</Link>
          </Button>
        </div>
      </div>

      <div className="page flex justify-center pb-3 md:hidden">
        <NavLinks />
      </div>
    </header>
  );
}
