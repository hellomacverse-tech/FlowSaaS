import { Clock, Cpu, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { WorkflowDetail } from "@/types/domain";

export function QuickViewContent({ 
  workflow, 
  onClose 
}: { 
  workflow: WorkflowDetail; 
  onClose?: () => void 
}) {
  return (
    <div>
      {/* প্রিভিউ সেকশন - ডায়নামিক নোড প্রিভিউ */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-teal-950 via-slate-900 to-violet-950 flex flex-col items-center justify-center border border-line/40 p-6 text-center shadow-inner">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 shadow-lg">
            <Zap size={18} />
          </div>
          <div className="h-0.5 w-8 bg-gradient-to-r from-teal-500 to-violet-500" />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400 shadow-lg">
            <Cpu size={18} />
          </div>
          <div className="h-0.5 w-8 bg-gradient-to-r from-violet-500 to-coral-500" />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-500/20 border border-coral-500/40 text-coral-400 shadow-lg">
            <ArrowRight size={18} />
          </div>
        </div>

        <span className="relative z-10 text-xs font-semibold uppercase tracking-wider text-teal-300 bg-teal-900/60 border border-teal-500/30 px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
          Live Automation Preview • {workflow.difficulty}
        </span>
      </div>

      <h2 className="text-h3 mt-4 pr-8 text-ink">{workflow.title}</h2>
      <p className="mt-1.5 text-sm text-ink-2">{workflow.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {workflow.integrations.slice(0, 6).map((slug) => (
          <Badge key={slug} tone="slate" className="capitalize">
            {slug.replace(/-/g, " ")}
          </Badge>
        ))}
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
        <Clock aria-hidden="true" size={13} />
        Saves {workflow.roiHoursPerWeek} hrs/week
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {workflow.requirements.map((req) => (
          <span
            key={req.label}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              req.required ? "bg-coral-50 text-coral-700" : "bg-surface-2 text-muted"
            }`}
          >
            {req.label}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-4">
        <p className="text-xl font-extrabold text-ink">${(workflow.price.amountCents / 100).toFixed(0)}</p>
        <div className="flex gap-2">
          {/* স্ট্যান্ডার্ড ট্যাগ ব্যবহার করা হলো যাতে মোদাল বাইপাস করে সরাসরি পেজে যায় */}
          <Button size="sm" variant="secondary-outline" onClick={onClose} asChild={false}>
            <a href={`/workflows/${workflow.slug}`}>View full details</a>
          </Button>
          <Button size="sm" onClick={onClose} asChild={false}>
            <a href={`/workflows/${workflow.slug}`}>
              Buy — ${(workflow.price.amountCents / 100).toFixed(0)}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}