export type Tier = "free" | "vip" | "enterprise";
export type WorkflowStatus = "draft" | "published" | "archived";
export type CategorySlug =
  | "facebook-crm"
  | "lead-generation"
  | "social-media"
  | "e-commerce"
  | "ai-llm";
export type IntegrationSlug =
  | "facebook-messenger"
  | "openai"
  | "google-sheets"
  | "shopify"
  | "airtable"
  | "telegram"
  | "slack"
  | "gmail"
  | "notion"
  | "hubspot"
  | "whatsapp-business"
  | "stripe"
  | "wordpress"
  | "linkedin"
  | "x-twitter"
  | "facebook-pages"
  | "instagram"
  | "google-drive"
  | "google-calendar"
  | "webhook"
  // Extensions beyond the base Section 6 list: two of the twelve launch
  // workflows (Section 10, #4 and #7) use Google Places and RSS, which the
  // original IntegrationSlug enum didn't include. Section 6 explicitly
  // allows extending this type "as needed, never loosen."
  | "google-places"
  | "rss";

export interface Money {
  amountCents: number;
  currency: "usd" | "eur" | "gbp";
}

export interface Requirement {
  label: string;
  detail: string;
  required: boolean;
}

export interface WorkflowSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categories: CategorySlug[];
  integrations: IntegrationSlug[];
  tags: string[];
  price: Money;
  vipIncluded: boolean;
  /** Rendered "Saves {n} hrs/week". */
  roiHoursPerWeek: number;
  /** null until >= 1 verified review — UI renders "New". */
  rating: { average: number; count: number } | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  setupMinutes: number;
  nodeCount: number;
  sandboxSupported: boolean;
  status: "live" | "beta" | "updating";
  publishedAt: string;
  updatedAt: string;
  currentVersion: string;
  popularityScore: number;
}

export interface WorkflowDetail extends WorkflowSummary {
  subtitle: string;
  descriptionMd: string;
  requirements: Requirement[];
  n8nMinVersion: string;
  video: { url: string; thumbnail: string; durationSeconds: number } | null;
  howToSteps: { step: number; name: string; text: string; videoStartSeconds?: number }[];
  nodes: {
    name: string;
    type: string;
    purpose: string;
    credentialsNeeded: string | null;
    notes: string;
  }[];
  graph: WorkflowGraph;
  faqs: Faq[];
  changelog: { version: string; date: string; notes: string }[];
}

export interface WorkflowGraph {
  nodes: {
    id: string;
    name: string;
    type: string;
    group: "trigger" | "logic" | "ai" | "data" | "output";
    x: number;
    y: number;
  }[];
  edges: { from: string; to: string; label?: string }[];
}

export interface Faq {
  id: string;
  question: string;
  answerMd: string;
  answerPlain: string;
}

export interface SandboxStep {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  ms?: number;
  detail?: string;
}

export interface SandboxResult {
  runId: string;
  status: "succeeded" | "failed" | "timeout";
  steps: SandboxStep[];
  output: unknown;
  durationMs: number;
}

export interface UsagePoint {
  day: string;
  executions: number;
  failures: number;
}

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  creditsPerRun: number;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}
