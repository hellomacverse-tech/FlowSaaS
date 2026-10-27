"use client";

import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface InstanceRow {
  id: string;
  label: string;
  base_url: string;
  last_verified_at: string | null;
  n8n_version: string | null;
}

/**
 * Connect form + list (Section 7.4). The API key is entered once, sent over
 * HTTPS, encrypted server-side (AES-256-GCM) before storage, and never
 * returned to the browser again — this component never holds or displays it
 * after submit.
 */
export function InstanceManager({ initialInstances }: { initialInstances: InstanceRow[] }) {
  const [instances, setInstances] = useState(initialInstances);
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/instances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, baseUrl, apiKey }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "connect-failed");
      setInstances((list) => [json.instance, ...list]);
      setLabel("");
      setBaseUrl("");
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error && err.message !== "connect-failed" ? err.message : "Couldn't connect. Check the URL and API key and try again.");
    } finally {
      setConnecting(false);
    }
  }

  async function test(id: string) {
    setTesting(id);
    try {
      const res = await fetch(`/api/instances/${id}/test`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setInstances((list) => list.map((i) => (i.id === id ? { ...i, last_verified_at: new Date().toISOString(), n8n_version: json.n8nVersion ?? i.n8n_version } : i)));
      }
    } finally {
      setTesting(null);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/instances/${id}`, { method: "DELETE" });
    setInstances((list) => list.filter((i) => i.id !== id));
  }

  return (
    <div>
      <Card className="p-6">
        <p className="text-sm font-semibold text-ink">Connect an instance</p>
        <form onSubmit={connect} className="mt-3 flex flex-col gap-4">
          <Input label="Label" placeholder="e.g. Production" value={label} onChange={(e) => setLabel(e.target.value)} required />
          <Input label="Base URL" type="url" placeholder="https://n8n.yourcompany.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required hint="Must be HTTPS and publicly reachable — not localhost or a private IP." />
          <Input label="API key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required hint="From your n8n instance's Settings → API." />
          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
          <Button type="submit" loading={connecting} className="self-start">
            Connect &amp; verify
          </Button>
        </form>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {instances.length === 0 ? (
          <p className="text-sm text-muted">No instances connected yet.</p>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{instance.label}</p>
                <p className="text-xs text-muted">{instance.base_url}</p>
                <p className="text-xs text-muted">
                  {instance.n8n_version ? `n8n ${instance.n8n_version} · ` : ""}
                  {instance.last_verified_at ? `verified ${new Date(instance.last_verified_at).toLocaleString()}` : "not yet verified"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" loading={testing === instance.id} onClick={() => test(instance.id)} aria-label="Test connection">
                  <RefreshCw aria-hidden="true" size={14} />
                </Button>
                <button type="button" onClick={() => remove(instance.id)} aria-label={`Remove ${instance.label}`} className="rounded-lg p-2 text-muted hover:text-danger">
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
