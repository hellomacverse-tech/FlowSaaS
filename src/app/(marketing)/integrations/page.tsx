import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Integrations",
    description: "See every app FlowSaaS workflows connect, and every pair of apps we've documented an integration for.",
    path: "/integrations",
    indexable: false,
  });
}

export default function IntegrationsPage() {
  return (
    <ComingSoonSection
      eyebrow="INTEGRATIONS"
      title="Integrations"
      description="See every app FlowSaaS workflows connect, and every pair of apps we've documented an integration for."
      phase="Phase 7 (pSEO & technical SEO)"
    />
  );
}
