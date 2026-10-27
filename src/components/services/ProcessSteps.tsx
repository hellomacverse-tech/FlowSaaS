import { Card } from "@/components/ui/Card";

const steps = [
  {
    number: 1,
    title: "Discovery & Architecture Call",
    description:
      "We map your current process, tools, volumes, and risks in a 45-minute call, then propose a workflow architecture with clear scope and timeline.",
    deliverable: "Architecture brief & fixed-scope quote",
    duration: "Day 1–2",
  },
  {
    number: 2,
    title: "Custom n8n Workflow Engineering",
    description:
      "Our engineers build your workflows from proven FlowSaaS modules, add custom logic and AI agents, and demo progress at each milestone.",
    deliverable: "Working workflows in a staging environment",
    duration: "Day 3–10",
  },
  {
    number: 3,
    title: "Server Installation & Security Testing",
    description:
      "We install and harden n8n on your server (or connect your n8n Cloud), configure encrypted credentials, backups, and monitoring, then run load and failure tests.",
    deliverable: "Production deployment + test report",
    duration: "Day 8–12",
  },
  {
    number: 4,
    title: "Handover, Team Training & Ongoing Maintenance",
    description:
      "We train your team with recorded sessions and runbooks, then support you for 30 days. Optional maintenance plans keep everything patched and monitored.",
    deliverable: "Runbook, recordings, 30-day support",
    duration: "Day 12–14, then ongoing",
  },
];

export function ProcessSteps() {
  return (
    <section id="process" aria-labelledby="process-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-caption text-center text-violet-600">HOW IT WORKS</p>
        <h2 id="process-heading" className="text-h2 mt-2 text-center text-ink">
          A 4-Step Done-For-You Process
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.number} className="flex flex-col p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 font-display text-sm font-bold text-violet-600">
                {step.number}
              </span>
              <h3 className="mt-3 text-[15px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-2">{step.description}</p>
              <p className="mt-3 text-xs font-medium text-ink">Deliverable: {step.deliverable}</p>
              <p className="mt-1 text-xs text-muted">{step.duration}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
