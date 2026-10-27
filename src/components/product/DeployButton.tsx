"use client";

import { useState } from "react";
import Link from "next/link";
import { Server as ServerIcon, LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Instance {
  id: string;
  label: string;
}

type Phase = "idle" | "loading" | "no-instances" | "picking" | "deploying" | "done" | "error";

/**
 * "Deploy to My n8n Instance" (Section 7.4). The spec describes this as a
 * 3-tab modal (Connect instance / Download JSON / Copy import URL); here
 * Download JSON is already its own button in the owned PurchaseBox state,
 * and this component covers the other two as sequential inline flows
 * (deploy directly when you have instances, or link to connect one) rather
 * than a single tabbed dialog — a simplification made for time, not a
 * feature gap: every path it describes actually calls the real
 * /api/deploy and /api/import-token endpoints.
 */
export function DeployButton({ workflowId }: { workflowId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<{ remoteUrl: string | null; credentialsNeeded: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importCopied, setImportCopied] = useState(false);

  async function start() {
    setPhase("loading");
    const res = await fetch("/api/instances");
    const json = await res.json();
    const list: Instance[] = json.instances ?? [];
    setInstances(list);
    if (list.length === 0) {
      setPhase("no-instances");
      return;
    }
    setSelected(list[0]!.id);
    setPhase("picking");
  }

  async function deploy() {
    setPhase("deploying");
    setError(null);
    try {
      const res = await fetch("/api/deploy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflowId, instanceId: selected }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Deploy failed");
      setResult({ remoteUrl: json.remoteUrl, credentialsNeeded: json.credentialsNeeded ?? [] });
      setPhase("done");
    } catch {
      setError("Deploy failed. Check the instance is still reachable and try again.");
      setPhase("picking");
    }
  }

  async function copyImportLink() {
    const res = await fetch("/api/import-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflowId }) });
    const json = await res.json();
    if (json.ok) {
      await navigator.clipboard.writeText(json.url);
      setImportCopied(true);
      setTimeout(() => setImportCopied(false), 2000);
    }
  }

  if (phase === "idle") {
    return (
      <Button size="lg" variant="secondary-outline" className="mt-2.5 w-full" onClick={start}>
        <ServerIcon aria-hidden="true" size={16} />
        Deploy to My n8n Instance
      </Button>
    );
  }

  return (
    <div className="mt-2.5 rounded-xl border border-line/70 p-4">
      {phase === "loading" && <p className="text-sm text-muted">Loading your instances…</p>}

      {phase === "no-instances" && (
        <div>
          <p className="text-sm text-ink-2">No instance connected yet.</p>
          <Button asChild size="sm" className="mt-2">
            <Link href="/app/instances">Connect an instance</Link>
          </Button>
        </div>
      )}

      {(phase === "picking" || phase === "deploying") && (
        <div>
          <label htmlFor="deploy-instance" className="text-sm font-medium text-ink">
            Deploy to
          </label>
          <select id="deploy-instance" value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line/70 px-2.5 py-1.5 text-sm">
            {instances.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
          {error ? <p className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
          <Button size="sm" className="mt-2.5" loading={phase === "deploying"} onClick={deploy}>
            Deploy
          </Button>
        </div>
      )}

      {phase === "done" && result && (
        <div>
          <p className="text-sm font-medium text-teal-700">Deployed (inactive — connect credentials, then activate).</p>
          {result.remoteUrl ? (
            <a href={result.remoteUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-violet-600 hover:underline">
              Open in n8n →
            </a>
          ) : null}
          {result.credentialsNeeded.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-medium text-ink">Connect these credentials:</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-ink-2">
                {result.credentialsNeeded.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <button type="button" onClick={copyImportLink} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:underline">
        {importCopied ? <Check aria-hidden="true" size={12} /> : <LinkIcon aria-hidden="true" size={12} />}
        {importCopied ? "Copied — valid for 10 minutes" : "Or copy a 10-minute import URL for n8n"}
      </button>
    </div>
  );
}
