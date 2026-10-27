import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildOrganizationNode, buildWebsiteNode } from "@/lib/schema/organization";
import { buildWorkflowGraph } from "@/lib/schema/workflow";
import { siteConfig } from "@/config/site";
import { catalogSeed } from "@/data/catalog-seed";
import { getWorkflowDetail } from "@/data/workflow-details";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Accordion } from "@/components/ui/Accordion";
import { WorkflowGraphInteractive } from "@/components/product/WorkflowGraphInteractive";
import { WorkflowSandboxPreview } from "@/components/product/WorkflowSandboxPreview";
import { HowItWorksTab } from "@/components/product/HowItWorksTab";
import { VideoGuideTab } from "@/components/product/VideoGuideTab";
import { NodesDocsTab } from "@/components/product/NodesDocsTab";
import { ReviewsTab } from "@/components/product/ReviewsTab";
import { PurchaseBox } from "@/components/product/PurchaseBox";
import { RelatedWorkflows } from "@/components/product/RelatedWorkflows";

export function generateStaticParams() {
  return catalogSeed.map((workflow) => ({ slug: workflow.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const workflow = getWorkflowDetail(slug);
  if (!workflow) {
    return buildPageMetadata({
      title: "Workflow not found",
      description: "This workflow isn't in the FlowSaaS catalog.",
      path: `/workflows/${slug}`,
      indexable: false,
    });
  }

  return buildPageMetadata({
    title: workflow.title,
    description: workflow.summary,
    path: `/workflows/${workflow.slug}`,
    ogImage: `${siteConfig.url}/og/workflows/${workflow.slug}`,
    indexable: true,
  });
}

function statusLabel(status: string): string {
  return status === "live" ? "Live" : status === "beta" ? "Beta" : "Updating";
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workflow = getWorkflowDetail(slug);
  if (!workflow) {
    notFound();
  }

  const { softwareNode, howToNode, faqNode, breadcrumb } = buildWorkflowGraph(workflow);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildOrganizationNode(), buildWebsiteNode(), softwareNode, howToNode, faqNode, breadcrumb],
        }}
      />

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Workflows", href: "/workflows" },
              { label: workflow.title },
            ]}
          />

          <h1 className="text-h2 mt-3 max-w-3xl text-ink">{workflow.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-2">{workflow.subtitle}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {workflow.integrations.map((slug) => (
              <Badge key={slug} tone="slate" className="capitalize">
                {slug.replace(/-/g, " ")}
              </Badge>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {statusLabel(workflow.status)}
            </span>
            <span>v{workflow.currentVersion}</span>
            <span>Updated {workflow.updatedAt}</span>
            <span>{workflow.rating ? `★ ${workflow.rating.average.toFixed(1)}` : "New"}</span>
            <span>{workflow.nodeCount} nodes</span>
            <span>Setup ≈ {workflow.setupMinutes} min</span>
            <span className="capitalize">{workflow.difficulty}</span>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="flex flex-col gap-8 lg:col-span-8">
              <div>
                <p className="text-h3 mb-3 text-ink">Workflow Graph</p>
                <WorkflowGraphInteractive graph={workflow.graph} nodeDocs={workflow.nodes} />
              </div>

              <WorkflowSandboxPreview workflow={workflow} />

              <Tabs
                syncHash
                items={[
                  { id: "how-it-works", label: "How It Works", content: <HowItWorksTab workflow={workflow} /> },
                  { id: "video", label: "Video Guide", content: <VideoGuideTab workflow={workflow} /> },
                  { id: "nodes", label: "Nodes & API Docs", content: <NodesDocsTab workflow={workflow} /> },
                  { id: "reviews", label: "Reviews", content: <ReviewsTab workflow={workflow} /> },
                ]}
              />

              <RelatedWorkflows current={workflow} />

              <div>
                <p className="text-h3 mb-4 text-ink">Workflow FAQ</p>
                <Accordion
                  items={workflow.faqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answerPlain }))}
                />
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <PurchaseBox workflow={workflow} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
