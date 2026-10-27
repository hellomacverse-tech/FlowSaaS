"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Copy, Check, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ManageBillingButton } from "./ManageBillingButton";

function maskKey(key: string): string {
  const parts = key.split("-");
  const last = parts[parts.length - 1] ?? "";
  return `FSK-••••-••••-••••-${last}`;
}

export function AccountInfoCard({
  email,
  fullName,
  tier,
  licenseKey: initialKey,
  renewsAt,
  hasStripeCustomer,
}: {
  email: string;
  fullName: string | null;
  tier: "free" | "vip" | "enterprise";
  licenseKey: string;
  renewsAt: string | null;
  hasStripeCustomer: boolean;
}) {
  const [licenseKey, setLicenseKey] = useState(initialKey);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingRegen, setConfirmingRegen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/account/regenerate-license", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setLicenseKey(json.licenseKey);
        setRevealed(true);
      }
    } finally {
      setRegenerating(false);
      setConfirmingRegen(false);
    }
  }

  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-600">
          {email.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{fullName || email}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Badge tone={tier === "vip" ? "violet" : tier === "enterprise" ? "slate" : "slate"} className="capitalize">
          {tier}
        </Badge>
        {renewsAt ? <span className="text-xs text-muted">Renews {new Date(renewsAt).toLocaleDateString()}</span> : null}
      </div>

      <div className="mt-4 rounded-xl bg-surface p-3">
        <p className="text-xs text-muted">License key</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate font-mono text-sm text-ink">{revealed ? licenseKey : maskKey(licenseKey)}</code>
          <button type="button" onClick={() => setRevealed((v) => !v)} aria-label={revealed ? "Hide license key" : "Reveal license key"} className="text-muted hover:text-ink-2">
            {revealed ? <EyeOff aria-hidden="true" size={15} /> : <Eye aria-hidden="true" size={15} />}
          </button>
          <button type="button" onClick={copyKey} aria-label="Copy license key" className="text-muted hover:text-ink-2">
            {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
          </button>
        </div>
        {confirmingRegen ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-danger">This invalidates your current key. Continue?</p>
            <button type="button" onClick={regenerate} disabled={regenerating} className="text-xs font-semibold text-danger hover:underline">
              {regenerating ? "Regenerating…" : "Yes, regenerate"}
            </button>
            <button type="button" onClick={() => setConfirmingRegen(false)} className="text-xs text-muted hover:underline">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingRegen(true)} className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline">
            <RotateCcw aria-hidden="true" size={12} />
            Regenerate
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ManageBillingButton hasStripeCustomer={hasStripeCustomer} />
        {tier === "free" ? (
          <Button asChild size="sm">
            <Link href="/pricing#vip">Upgrade plan</Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
