import Link from "next/link";
import { Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { toolSeeds } from "@/data/tools";

export function QuickLaunchTools() {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-ink">Quick launch</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {toolSeeds.slice(0, 4).map((tool) => (
          <Link key={tool.slug} href={`/app/tools/${tool.slug}`} className="flex flex-col gap-2 rounded-xl border border-line/70 p-3 hover:bg-surface">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Zap aria-hidden="true" size={15} />
            </span>
            <span className="text-xs font-medium text-ink">{tool.name}</span>
            <span className="text-[11px] text-muted">
              {tool.creditsPerRun} credit{tool.creditsPerRun === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
