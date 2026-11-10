import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "./icon";

/** Quiet "View all >" link for a card header. */
export function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-md text-[12.5px] text-t3 transition-colors hover:text-foreground"
    >
      {children}
      <Icon icon={ArrowRight01Icon} className="size-3.5" />
    </Link>
  );
}
