"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ManageBillingButton({ hasStripeCustomer }: { hasStripeCustomer: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasStripeCustomer) {
    return <p className="text-sm text-muted">No billing history yet — this appears once you make a purchase.</p>;
  }

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? "Failed to open billing portal");
      window.location.href = json.url;
    } catch {
      setError("Couldn't open the billing portal. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={openPortal} loading={loading} variant="secondary-outline">
        Manage billing
      </Button>
      {error ? <p className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}
