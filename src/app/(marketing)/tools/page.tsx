import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { GradientSpheres } from "@/components/layout/GradientSpheres";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { toolSeeds } from "@/data/tools";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Micro-SaaS Tools",
    description: "Run FlowSaaS automations directly from your browser with simple input forms — no n8n installation needed.",
    path: "/tools",
  });
}

export default function ToolsPage() {
  const pageUrl = `${siteConfig.url}/tools`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#itemlist`,
              itemListElement: toolSeeds.map((tool, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: { "@type": "SoftwareApplication", name: tool.name, applicationCategory: "BusinessApplication" },
              })),
            },
          ],
        }}
      />

      <section className="relative overflow-hidden py-16 md:py-24">
        <GradientSpheres variant="hero" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-h1 text-ink">Micro-SaaS Automation Tools — No n8n Required</h1>
          <p className="prose-measure mx-auto mt-5 text-lg text-ink-2">
            Fill in a form, get a structured result. Every tool runs on our servers — nothing to install, nothing to configure.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {toolSeeds.map((tool) => (
              <Card key={tool.slug} className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">{tool.name}</p>
                  <Badge tone="teal">
                    {tool.creditsPerRun} credit{tool.creditsPerRun === 1 ? "" : "s"}/run
                  </Badge>
                </div>
                <p className="mt-2 flex-1 text-sm text-ink-2">{tool.description}</p>
                <div className="mt-4 rounded-xl bg-surface p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Example</p>
                  <pre className="mt-1 overflow-x-auto text-xs text-ink-2">{JSON.stringify(tool.exampleInput, null, 2)}</pre>
                </div>
                <Button asChild size="sm" className="mt-4 self-start">
                  <Link href={`/signup?next=/app/tools/${tool.slug}`}>Try free</Link>
                </Button>
              </Card>
            ))}
          </div>

          <Card className="mt-8 p-6 text-center">
            <p className="text-sm text-ink-2">
              Every account starts with <strong>50 free credits/month</strong>. VIP includes 2,000/month, and credit packs are available any time.
            </p>
            <Button asChild size="sm" variant="secondary-outline" className="mt-3">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </Card>
        </div>
      </section>
    </>
  );
}
