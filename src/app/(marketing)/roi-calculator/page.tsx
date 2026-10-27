import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { ComingSoonSection } from "@/components/marketing/ComingSoonSection";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "ROI Calculator",
    description: "See what automation is worth to your team — move the sliders, watch the math.",
    path: "/roi-calculator",
    indexable: false,
  });
}

export default function RoiCalculatorPage() {
  return (
    <ComingSoonSection
      eyebrow="ROI CALCULATOR"
      title="ROI Calculator"
      description="See what automation is worth to your team — move the sliders, watch the math."
      phase="Phase 2 (Marketing core)"
    />
  );
}
