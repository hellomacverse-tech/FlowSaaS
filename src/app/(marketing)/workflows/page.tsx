import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { CatalogExplorer } from "@/components/catalog/CatalogExplorer";
import { Skeleton } from "@/components/ui/Skeleton";
import { catalogSeed } from "@/data/catalog-seed";

/**
 * Deliberately static, no `searchParams` param: Section 2.2 specifies
 * `/workflows` as an "SSG shell + client-side filtering," and reading
 * `searchParams` in `generateMetadata` would force the whole route to
 * render dynamically per request, trading that away just to noindex
 * filtered URLs. All filter/sort/search state lives in the URL via nuqs
 * entirely client-side, so the canonical, always-indexable metadata below
 * is correct for the URL Google actually crawls (`/workflows` with no
 * params). Properly noindexing `/workflows?cat=...` variants without
 * sacrificing static generation needs an edge-middleware `X-Robots-Tag`
 * rule keyed on query-string presence — a Phase 7 (technical SEO) item,
 * not a page-level `generateMetadata` concern.
 */
export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Workflow Catalog",
    description:
      "Browse production-ready n8n workflows, filter by app and category, and see the time each one saves you.",
    path: "/workflows",
    indexable: true,
  });
}

export default function WorkflowsPage() {
  const pageUrl = `${siteConfig.url}/workflows`;

  return (
    <section className="py-16 md:py-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `${pageUrl}#collection`,
              url: pageUrl,
              name: "Workflow Catalog",
            },
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#itemlist`,
              itemListElement: catalogSeed.slice(0, 12).map((workflow, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: workflow.title,
                url: `${pageUrl}/${workflow.slug}`,
              })),
            },
          ],
        }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-muted">Home / Workflows</p>
        <h1 className="text-h2 mt-2 text-ink">Workflow Catalog</h1>
        <p className="prose-measure mt-3 text-ink-2">
          Browse production-ready n8n workflows. Filter by app, category, and the time they save you.
        </p>

        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CatalogExplorer />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
