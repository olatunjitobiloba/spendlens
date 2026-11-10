import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/utils/cn";
import { Icon } from "./icon";

/** A link to the transactions behind a number (PRD R2). */
export function EvidenceLink({
  href,
  children = "See transactions",
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-[12.5px] font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      <Icon icon={ArrowRight01Icon} className="size-3.5" />
    </Link>
  );
}
