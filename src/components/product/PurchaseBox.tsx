"use client";

import { useEffect, useState } from "react";
import { Lock, Check, Download } from "lucide-react";
import { DeployButton } from "./DeployButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WorkflowDetail } from "@/types/domain";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

interface EntitlementState {
  status: "checking" | "owned" | "not-owned";
  dbWorkflowId: string | null;
}

/**
 * Fetches ownership after mount rather than the product page checking it
 * server-side, so the page itself stays statically generated/ISR (Section
 * 2.2) instead of being forced dynamic just for this one personalized
 * widget. Signed-out visitors resolve to "not-owned" immediately since
 * `/api/entitlements/[slug]` short-circuits without a DB round trip for them.
 */
function useEntitlement(slug: string): EntitlementState {
  const [state, setState] = useState<EntitlementState>({ status: "checking", dbWorkflowId: null });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/entitlements/${slug}`)
      .then((res) => res.json())
      .then((json: { owned: boolean; dbWorkflowId: string | null }) => {
        if (!cancelled) {
          setState({ status: json.owned ? "owned" : "not-owned", dbWorkflowId: json.dbWorkflowId });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "not-owned", dbWorkflowId: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}

export function PurchaseBox({ workflow }: { workflow: WorkflowDetail }) {
  const entitlement = useEntitlement(workflow.slug);
  const [loading, setLoading] = useState<"buy" | "vip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(kind: "buy" | "vip") {
    setLoading(kind);
    setError(null);
    try {
      const body =
        kind === "buy"
          ? { kind: "workflow" as const, slug: workflow.slug }
          : { kind: "vip" as const, interval: "month" as const };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? "Checkout failed");
      window.location.href = json.url;
    } catch {
      setError("Something went wrong starting checkout. Please try again.");
      setLoading(null);
    }
  }

  return (
    <Card className="border-t-2 border-t-violet-300 p-6">
      {entitlement.status === "checking" ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : entitlement.status === "owned" && entitlement.dbWorkflowId ? (
        <>
          <p className="text-sm font-semibold text-teal-700">You have access · v{workflow.currentVersion}</p>
          <Button asChild size="lg" className="mt-4 w-full">
            <a href={`/api/download/${entitlement.dbWorkflowId}`}>
              <Download aria-hidden="true" size={16} />
              Download JSON
            </a>
          </Button>
          <DeployButton workflowId={entitlement.dbWorkflowId} />
        </>
      ) : (
        <>
          <p className="text-3xl font-extrabold text-ink">{formatPrice(workflow.price.amountCents)}</p>
          <p className="text-sm text-muted">one-time</p>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            OR
            <span className="h-px flex-1 bg-line" />
          </div>

          {workflow.vipIncluded ? (
            <div className="flex items-center justify-between rounded-xl bg-violet-50 p-3 text-sm">
              <span className="text-ink-2">Included with the $29/mo VIP Pass</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-violet-600">
                7-day trial
              </span>
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm font-medium text-danger">{error}</p> : null}

          <Button
            size="lg"
            className="mt-5 w-full"
            loading={loading === "buy"}
            disabled={loading !== null}
            onClick={() => startCheckout("buy")}
          >
            Buy Now — {formatPrice(workflow.price.amountCents)}
          </Button>
          <Button
            size="lg"
            variant="secondary-outline"
            className="mt-2.5 w-full"
            loading={loading === "vip"}
            disabled={loading !== null}
            onClick={() => startCheckout("vip")}
          >
            Start VIP Trial — $29/mo
          </Button>
        </>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-line/70 pt-5 text-sm">
        <p className="font-semibold text-ink">What you get</p>
        {[
          "Import-ready n8n JSON",
          workflow.video
            ? `Setup video (${Math.round((workflow.video.durationSeconds ?? 0) / 60)} min)`
            : "Setup guide (written steps)",
          "Node & API documentation",
          "12 months of updates (VIP: for as long as you subscribe)",
          "Email support",
        ].map((item) => (
          <p key={item} className="flex items-start gap-2 text-ink-2">
            <Check aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-teal-700" />
            {item}
          </p>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-line/70 pt-5 text-sm">
        <p className="font-semibold text-ink">System requirements</p>
        {workflow.requirements.map((req) => (
          <div key={req.label} className="flex items-start justify-between gap-2 text-ink-2">
            <span>
              {req.label}
              <span className="block text-xs text-muted">{req.detail}</span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                req.required ? "bg-coral-50 text-coral-700" : "bg-surface-2 text-muted"
              }`}
            >
              {req.required ? "Required" : "Optional"}
            </span>
          </div>
        ))}
        <p className="text-ink-2">Estimated setup: {workflow.setupMinutes} minutes</p>
        <p className="capitalize text-ink-2">Difficulty: {workflow.difficulty}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/70 pt-5 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Lock aria-hidden="true" size={12} />
          Secure checkout by Stripe
        </span>
        <span>14-day refund</span>
        <span>Licence key emailed instantly</span>
      </div>
    </Card>
  );
}
