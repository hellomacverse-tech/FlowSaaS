import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Changelog",
    description: "Every workflow update, new template, and platform change, in one place.",
    path: "/changelog",
    indexable: false,
  });
}

export default function ChangelogPage() {
  return (
    <ComingSoonSection
      eyebrow="RESOURCES"
      title="Changelog"
      description="Every workflow update, new template, and platform change, in one place."
      phase="Phase 3 (Catalog & product)"
    />
  );
}
