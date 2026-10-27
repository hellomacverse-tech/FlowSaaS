import { siteConfig } from "@/config/site";

/**
 * @id anchors used across every page's @graph so nodes can reference each
 * other (Section 13.2). Keep these stable — changing them breaks existing
 * cross-references in previously-crawled pages.
 */
export const schemaIds = {
  organization: `${siteConfig.url}/#organization`,
  website: `${siteConfig.url}/#website`,
} as const;

export function buildOrganizationNode() {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);

  return {
    "@type": "Organization" as const,
    "@id": schemaIds.organization,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject" as const,
      url: `${siteConfig.url}/logo-512.png`,
      width: 512,
      height: 512,
    },
    contactPoint: [
      {
        "@type": "ContactPoint" as const,
        contactType: "customer support",
        email: siteConfig.supportEmail,
        availableLanguage: ["English"],
      },
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildWebsiteNode() {
  return {
    "@type": "WebSite" as const,
    "@id": schemaIds.website,
    url: siteConfig.url,
    name: siteConfig.name,
    publisher: { "@id": schemaIds.organization },
  };
}

export function buildBreadcrumbNode(
  pageUrl: string,
  items: { name: string; item?: string }[],
) {
  return {
    "@type": "BreadcrumbList" as const,
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: entry.name,
      ...(entry.item ? { item: entry.item } : {}),
    })),
  };
}
