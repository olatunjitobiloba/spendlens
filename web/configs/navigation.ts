import { siteConfig } from "@/configs/site";

export type NavItem = { label: string; href: string; external?: boolean };

export const mainNav: NavItem[] = [
  { label: "Why SpendLens", href: "/#why" },
  { label: "How it works", href: "/#how" },
  { label: "For banks", href: "/banks" },
  { label: "FAQ", href: "/#faq" },
];

export const footerNav: NavItem[] = [
  { label: "How it works", href: "/#how" },
  { label: "For banks", href: "/banks" },
  { label: "Privacy", href: "/privacy" },
  { label: "GitHub", href: siteConfig.links.github, external: true },
];
