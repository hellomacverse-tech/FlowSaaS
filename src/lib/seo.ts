import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface PageMetadataInput {
  /** Rendered inside the `%s | FlowSaaS` title template. Keep ≤ 60 chars. */
  title: string;
  /** ≤ 155 chars, unique per page. */
  description: string;
  /** Path only, e.g. "/workflows/facebook-messenger-crm-google-sheets". No trailing slash. */
  path: string;
  /** Absolute image URL for the OG card. Falls back to the default. */
  ogImage?: string;
  /** Set to false to emit `noindex,follow` (Section 13.6 / 11.4 quality gates). */
  indexable?: boolean;
  type?: "website" | "article";
}

function normalizePath(path: string): string {
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

/**
 * Builds a Next.js `Metadata` object with the canonical, OG, Twitter and
 * robots rules that every route must follow. Pages call this from their
 * `generateMetadata` export rather than constructing `Metadata` by hand, so
 * the canonical-URL and indexability rules can't drift page to page.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  ogImage,
  indexable = true,
  type = "website",
}: PageMetadataInput): Metadata {
  const normalizedPath = normalizePath(path);
  const url = `${siteConfig.url}${normalizedPath}`;
  const image = ogImage ?? `${siteConfig.url}/og/default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
