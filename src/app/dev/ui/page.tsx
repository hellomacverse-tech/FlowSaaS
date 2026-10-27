import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Badge, Chip } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { GradientSpheres } from "@/components/layout/GradientSpheres";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "UI Kit — internal",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line/70 py-10">
      <h2 className="text-h3 mb-6 text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-h2 mb-2 text-ink">FlowSaaS UI Kit</h1>
      <p className="mb-8 text-ink-2">
        Internal reference for every component the design system defines (Section 3.8). Not indexed, not
        linked from any marketing page.
      </p>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary-outline">Secondary outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges & chips">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="coral">Coral</Badge>
          <Badge tone="teal">Teal</Badge>
          <Badge tone="violet">Violet</Badge>
          <Badge tone="amber">Amber</Badge>
          <Badge tone="slate">Slate</Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip active>All</Chip>
          <Chip count={41}>Facebook &amp; CRM</Chip>
          <Chip count={18}>Lead Generation</Chip>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm font-semibold text-ink">Default card</p>
            <p className="mt-1 text-sm text-ink-2">rounded-2xl, hairline border, shadow-sm.</p>
          </Card>
          <Card interactive className="p-5">
            <p className="text-sm font-semibold text-ink">Interactive card</p>
            <p className="mt-1 text-sm text-ink-2">Hover to see the lift + shadow-md.</p>
          </Card>
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      <Section title="Progress ring">
        <div className="flex items-center gap-8">
          <ProgressRing value={72} label="Credits used">
            <span className="text-2xl font-extrabold text-ink">72%</span>
          </ProgressRing>
          <ProgressRing value={28} size={80} strokeWidth={8} label="Sandbox run progress" />
        </div>
      </Section>

      <Section title="Gradient spheres">
        <div className="relative h-64 overflow-hidden rounded-2xl border border-line/70 bg-white">
          <GradientSpheres variant="hero" />
        </div>
      </Section>
    </main>
  );
}
