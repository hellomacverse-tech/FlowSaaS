import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbNode, buildOrganizationNode, schemaIds } from "@/lib/schema/organization";
import { siteConfig } from "@/config/site";
import { GradientSpheres } from "@/components/layout/GradientSpheres";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { ProcessSteps } from "@/components/services/ProcessSteps";
import { PackageCards } from "@/components/services/PackageCards";
import { BookingQuoteWidget } from "@/components/services/BookingQuoteWidget";
import { servicesFaqs } from "@/data/services-faqs";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Managed Services",
    description:
      "A dedicated engineering team designs, deploys, and supports your n8n automations on your own infrastructure, with 30 days of support included.",
    path: "/services",
  });
}

export default function ServicesPage() {
  const pageUrl = `${siteConfig.url}/services`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOrganizationNode(),
            buildBreadcrumbNode(pageUrl, [
              { name: "Home", item: siteConfig.url },
              { name: "Managed Services" },
            ]),
            {
              "@type": "Service",
              "@id": `${pageUrl}#service`,
              name: "FlowSaaS Done-For-You Managed Setup",
              serviceType: "n8n workflow automation implementation",
              areaServed: "Worldwide",
              provider: { "@id": schemaIds.organization },
              url: pageUrl,
            },
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: servicesFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answerPlain },
              })),
            },
          ],
        }}
      />

      <section className="relative overflow-hidden py-16 md:py-24">
        <GradientSpheres variant="hero" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-h1 text-ink">
            We Build, Test, and Deploy Your n8n Automations 100% Done-For-You
          </h1>
          <p className="prose-measure mx-auto mt-5 text-lg text-ink-2">
            A dedicated engineering team designs your workflow architecture, deploys it on your servers, and
            supports it for 30 days after launch.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/services#book">Book a Discovery Call</Link>
            </Button>
            <Button asChild variant="secondary-outline" size="lg">
              <Link href="/services#quote">Request a Quote</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
            <span>30-day support included</span>
            <span>Deployed on your infrastructure</span>
            <span>Security-tested before handover</span>
          </div>
        </div>
      </section>

      <ProcessSteps />
      <PackageCards />

      <section id="book" aria-labelledby="book-heading" className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 id="book-heading" className="sr-only">
            Book a call or request a quote
          </h2>
          <div id="quote" />
          <BookingQuoteWidget />
        </div>
      </section>

      <section aria-labelledby="services-faq-heading" className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 id="services-faq-heading" className="text-h2 text-center text-ink">
            Frequently Asked Questions
          </h2>
          <div className="mt-8">
            <Accordion
              items={servicesFaqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answerPlain }))}
            />
          </div>
        </div>
      </section>
    </>
  );
}
