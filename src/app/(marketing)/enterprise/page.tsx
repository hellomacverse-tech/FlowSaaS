import type { Metadata } from "next";
import { ShieldCheck, KeyRound, Server, FileClock, Gauge, Users } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbNode, buildOrganizationNode } from "@/lib/schema/organization";
import { siteConfig } from "@/config/site";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Accordion } from "@/components/ui/Accordion";
import { QuoteForm } from "@/components/services/QuoteForm";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Enterprise",
    description:
      "Automation infrastructure built to pass your security review, with SSO, private libraries, and an uptime SLA.",
    path: "/enterprise",
  });
}

const capabilities = [
  { icon: Users, title: "SSO & SCIM" },
  { icon: Server, title: "Private workflow library" },
  { icon: Server, title: "Deployment on your cloud or on-premise" },
  { icon: FileClock, title: "Audit logs" },
  { icon: Gauge, title: "99.9% uptime SLA" },
  { icon: ShieldCheck, title: "Dedicated Slack channel & named engineer" },
];

const compliance = [
  { label: "SOC 2 Type II", status: "In progress" },
  { label: "GDPR-ready data handling", status: "Live" },
  { label: "HIPAA BAA available", status: "In progress" },
];

const enterpriseFaqs = [
  {
    id: "ent-faq-1",
    question: "How does the engagement model work?",
    answer:
      "Discovery maps your requirements and constraints, Pilot proves the architecture on one or two workflows, and Rollout scales it across your org with training and an SLA.",
  },
  {
    id: "ent-faq-2",
    question: "Can we deploy fully on-premise?",
    answer:
      "Yes — n8n and its supporting services can run entirely inside your own cloud account or on-premise infrastructure, with no data passing through FlowSaaS-hosted servers.",
  },
];

export default function EnterprisePage() {
  const pageUrl = `${siteConfig.url}/enterprise`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOrganizationNode(),
            buildBreadcrumbNode(pageUrl, [{ name: "Home", item: siteConfig.url }, { name: "Enterprise" }]),
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: enterpriseFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ],
        }}
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-h1 text-ink">Automation Infrastructure That Passes Your Security Review</h1>
        </div>

        <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <Card key={cap.title} className="flex items-center gap-3 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                  </span>
                  <p className="text-sm font-semibold text-ink">{cap.title}</p>
                </Card>
              );
            })}
          </div>

          <Card className="mt-10 p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <KeyRound aria-hidden="true" size={18} className="text-violet-600" />
              Security
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-ink-2 sm:grid-cols-2">
              <li>Encryption at rest and in transit (TLS 1.2+)</li>
              <li>Credential handling with AES-256-GCM</li>
              <li>Least-privilege access on every integration</li>
              <li>Automated backups with point-in-time recovery</li>
              <li>Documented incident response process</li>
              <li>Dependency scanning (Dependabot + CodeQL) in CI</li>
            </ul>
          </Card>

          <Card className="mt-6 p-6">
            <h2 className="text-[15px] font-semibold text-ink">Compliance roadmap</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {compliance.map((item) => (
                <li key={item.label} className="flex items-center justify-between text-sm text-ink-2">
                  {item.label}
                  <Badge tone={item.status === "Live" ? "teal" : "amber"}>{item.status}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              We list only what is currently true; anything not yet certified is marked &ldquo;In
              progress.&rdquo;
            </p>
          </Card>

          <Card className="mt-6 p-6">
            <h2 className="text-[15px] font-semibold text-ink">Engagement model</h2>
            <p className="mt-2 text-sm text-ink-2">Discovery → Pilot → Rollout, each with its own sign-off.</p>
          </Card>

          <div className="mt-10">
            <h2 className="text-h3 text-ink">Talk to us about your requirements</h2>
            <p className="mt-2 text-sm text-ink-2">
              The form below covers the essentials — mention your team size and any compliance requirements
              (SOC 2, HIPAA, data residency) in the project details field and we&apos;ll route it to the
              right person.
            </p>
            <div className="mt-6 max-w-2xl">
              <QuoteForm />
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-h2 text-center text-ink">Enterprise FAQ</h2>
            <div className="mt-8">
              <Accordion items={enterpriseFaqs} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
