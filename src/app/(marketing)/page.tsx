import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { schemaIds } from "@/lib/schema/organization";
import { siteConfig } from "@/config/site";
import { Hero } from "@/components/home/Hero";
import { MetricsBand } from "@/components/home/MetricsBand";
import { LiveSandbox } from "@/components/home/LiveSandbox";
import { TierModel } from "@/components/home/TierModel";
import { CatalogPreview } from "@/components/home/CatalogPreview";
import { RoiCalculator } from "@/components/home/RoiCalculator";
import { ProofSection } from "@/components/home/ProofSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { homeFaqs } from "@/data/faqs";
import { catalogSeed } from "@/data/catalog-seed";

// NOTE: Section 12 asks for the sandbox/calculator to load via
// `next/dynamic` + IntersectionObserver so their JS is fetched only once
// scrolled into view. A plain `next/dynamic(..., { ssr: true })` (the
// default) doesn't reduce Next's reported First Load JS — it still has to
// be ready for the initial server render — so it added complexity here
// without the intended payoff. Real deferred-fetch lazy loading needs a
// client wrapper that mounts the dynamic (ssr: false) import only after an
// IntersectionObserver fires; that's a Phase 8 (Hardening & launch)
// performance pass once every section using this pattern (sandbox,
// calculator, and Phase 6's dashboard charts) exists to optimize together.
// Current measured first-load JS for `/` is ~125 kB against a 120 kB budget.

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    path: "/",
  });
}

export default function HomePage() {
  const pageUrl = siteConfig.url;
  const featured = catalogSeed.slice(0, 6);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${pageUrl}#webpage`,
              url: pageUrl,
              name: `${siteConfig.name} — ${siteConfig.tagline}`,
              isPartOf: { "@id": schemaIds.website },
            },
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#featured-workflows`,
              itemListElement: featured.map((workflow, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: workflow.title,
                url: `${pageUrl}/workflows/${workflow.slug}`,
              })),
            },
            // Matches the accordion's visible text 1:1 (Section 9.1.8).
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: homeFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answerPlain },
              })),
            },
          ],
        }}
      />
      <Hero />
      <MetricsBand />
      <LiveSandbox />
      <TierModel />
      <CatalogPreview />
      <section id="roi" aria-labelledby="roi-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-caption text-center text-violet-600">ROI CALCULATOR</p>
          <h2 id="roi-heading" className="text-h2 mt-2 text-center text-ink">
            See What Automation Is Worth to Your Team
          </h2>
          <p className="prose-measure mx-auto mt-3 text-center text-ink-2">
            Move the sliders. Watch the math.
          </p>
          <div className="mt-8">
            <RoiCalculator variant="home" />
          </div>
        </div>
      </section>
      <ProofSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
