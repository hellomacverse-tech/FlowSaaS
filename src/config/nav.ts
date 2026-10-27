import type { Route } from "next";

export interface NavLink {
  label: string;
  href: Route;
}

/** Navbar center links, in the exact order specified (Section 9.0). */
export const primaryNav: NavLink[] = [
  { label: "Workflows Catalog", href: "/workflows" },
  { label: "Managed Services", href: "/services" },
  { label: "Micro-SaaS Tools", href: "/tools" },
  { label: "ROI Calculator", href: "/roi-calculator" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Pricing", href: "/pricing" },
];

export const footerNav = {
  product: [
    { label: "Workflows Catalog", href: "/workflows" },
    { label: "Micro-SaaS Tools", href: "/tools" },
    { label: "Pricing", href: "/pricing" },
    { label: "ROI Calculator", href: "/roi-calculator" },
    { label: "Integrations", href: "/integrations" },
  ] satisfies NavLink[],
  services: [
    { label: "Managed Setup", href: "/services" },
    { label: "Enterprise", href: "/enterprise" },
    { label: "Book a Call", href: "/services#book" },
  ] satisfies NavLink[],
  resources: [
    { label: "How to import a workflow", href: "/workflows#faq" },
    { label: "FAQ", href: "/#faq" },
    { label: "Changelog", href: "/changelog" },
  ] satisfies NavLink[],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refunds", href: "/refunds" },
    { label: "Security", href: "/security" },
  ] satisfies NavLink[],
};
