"use client";

import { useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export function ApiKeysManager({ initialKeys }: { initialKeys: KeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to create key");
      setNewKey(json.key);
      setKeys((k) => [json.record, ...k]);
      setName("");
    } catch {
      setError("Couldn't create a key. You may have reached the 10-key limit.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    setKeys((k) => k.map((key) => (key.id === id ? { ...key, revoked_at: new Date().toISOString() } : key)));
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {newKey ? (
        <Card className="mb-4 border-2 border-violet-300 p-4">
          <p className="text-sm font-semibold text-ink">Your new key — copy it now</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-surface px-3 py-2 font-mono text-xs">{newKey}</code>
            <Button size="sm" variant="secondary-outline" onClick={copyKey}>
              {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
            </Button>
          </div>
          <p className="mt-2 text-xs font-medium text-danger">You won&apos;t be able to see this key again.</p>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setNewKey(null)}>
            Done
          </Button>
        </Card>
      ) : (
        <form onSubmit={createKey} className="mb-4 flex items-end gap-2">
          <div className="flex-1">
            <Input label="New key name" placeholder="e.g. Zapier integration" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit" loading={creating}>
            Create key
          </Button>
        </form>
      )}
      {error ? <p className="mb-3 text-sm font-medium text-danger">{error}</p> : null}

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Prefix</th>
              <th className="px-4 py-2.5">Last used</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No API keys yet.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="border-t border-line/70">
                  <td className="px-4 py-2.5 text-ink">{k.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-2">{k.prefix}…</td>
                  <td className="px-4 py-2.5 text-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-4 py-2.5">{k.revoked_at ? <span className="text-muted">Revoked</span> : <span className="text-teal-700">Active</span>}</td>
                  <td className="px-4 py-2.5 text-right">
                    {!k.revoked_at ? (
                      <button type="button" onClick={() => revoke(k.id)} aria-label={`Revoke ${k.name}`} className="text-muted hover:text-danger">
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
