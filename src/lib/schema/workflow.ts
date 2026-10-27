import type { WorkflowDetail } from "@/types/domain";
import { siteConfig } from "@/config/site";
import { schemaIds, buildBreadcrumbNode } from "./organization";

export function buildWorkflowGraph(workflow: WorkflowDetail) {
  const url = `${siteConfig.url}/workflows/${workflow.slug}`;

  const softwareNode: Record<string, unknown> = {
    "@type": ["SoftwareApplication", "Product"],
    "@id": `${url}#software`,
    name: workflow.title,
    description: workflow.summary,
    image: [`${siteConfig.url}/og/workflows/${workflow.slug}`],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "n8n Workflow Template",
    operatingSystem: `n8n ${workflow.n8nMinVersion}+ (Cloud or self-hosted)`,
    softwareVersion: workflow.currentVersion,
    datePublished: workflow.publishedAt,
    dateModified: workflow.updatedAt,
    brand: { "@id": schemaIds.organization },
    publisher: { "@id": schemaIds.organization },
    offers: [
      {
        "@type": "Offer",
        name: "One-time template license",
        price: (workflow.price.amountCents / 100).toFixed(2),
        priceCurrency: workflow.price.currency.toUpperCase(),
        availability: "https://schema.org/InStock",
        url: `${url}#buy`,
        seller: { "@id": schemaIds.organization },
      },
      ...(workflow.vipIncluded
        ? [
            {
              "@type": "Offer",
              name: "VIP Pass (all workflows)",
              availability: "https://schema.org/InStock",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: "29.00",
                priceCurrency: "USD",
                billingDuration: "P1M",
                billingIncrement: 1,
                unitCode: "MON",
              },
              url: `${siteConfig.url}/pricing#vip`,
            },
          ]
        : []),
    ],
  };

  // Rating/Review schema must never be fabricated — omitted entirely
  // until >= 1 verified review exists (Section 13.5, rule 1).
  if (workflow.rating) {
    softwareNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: workflow.rating.average.toFixed(1),
      reviewCount: String(workflow.rating.count),
      bestRating: "5",
      worstRating: "1",
    };
  }

  const howToNode = {
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: `How to set up ${workflow.title} in n8n`,
    totalTime: `PT${workflow.setupMinutes}M`,
    tool: [{ "@type": "HowToTool", name: "n8n" }],
    supply: workflow.requirements
      .filter((r) => r.required)
      .map((r) => ({ "@type": "HowToSupply", name: r.label })),
    step: workflow.howToSteps.map((step) => ({
      "@type": "HowToStep",
      position: step.step,
      name: step.name,
      text: step.text,
      url: `${url}#step-${step.step}`,
    })),
  };

  const faqNode = {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: workflow.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answerPlain },
    })),
  };

  const breadcrumb = buildBreadcrumbNode(url, [
    { name: "Home", item: siteConfig.url },
    { name: "Workflows", item: `${siteConfig.url}/workflows` },
    { name: workflow.title },
  ]);

  return { softwareNode, howToNode, faqNode, breadcrumb };
}
