import Link from "next/link";
import type { Route } from "next";
import { Twitter, Linkedin } from "lucide-react";
import { Logo } from "./Logo";
import { footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site";

function FooterColumn({
  title,
  links,
  extra,
}: {
  title: string;
  links: { label: string; href: Route }[];
  /** Static files under /public (e.g. llms.txt) that aren't typed app routes. */
  extra?: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-ink-2 hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
        {extra?.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-sm text-ink-2 hover:text-ink">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line/70 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-ink-2">
              Production-ready n8n automation, delivered as templates, software, or done-for-you.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {siteConfig.social.x ? (
                <a href={siteConfig.social.x} aria-label="FlowSaaS on X" className="text-muted hover:text-ink">
                  <Twitter aria-hidden="true" size={18} />
                </a>
              ) : null}
              {siteConfig.social.linkedin ? (
                <a
                  href={siteConfig.social.linkedin}
                  aria-label="FlowSaaS on LinkedIn"
                  className="text-muted hover:text-ink"
                >
                  <Linkedin aria-hidden="true" size={18} />
                </a>
              ) : null}
            </div>
          </div>

          <FooterColumn title="Product" links={footerNav.product} />
          <FooterColumn title="Services" links={footerNav.services} />
          <FooterColumn
            title="Resources"
            links={footerNav.resources}
            extra={[{ label: "llms.txt", href: "/llms.txt" }]}
          />
          <FooterColumn title="Legal" links={footerNav.legal} />
        </div>

        <div className="mt-16 border-t border-line/70 pt-8">
          <p className="text-xs leading-relaxed text-muted">
            © {year} FlowSaaS. {siteConfig.legalDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
