/**
 * Seeds reference data (categories, integrations, home FAQs, seed
 * testimonials) into Supabase. Run with `pnpm seed`.
 *
 * Uses upsert on each table's natural unique key so the script is safe to
 * re-run. Workflow catalog seeding (12 launch workflows, their nodes docs,
 * how-to steps, and per-workflow FAQs) is added in Phase 3 once
 * `supabase/seed/workflows.json` exists — this script already loops over
 * `TABLES` so wiring that file in is a one-line addition, not a rewrite.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAllWorkflowDetails } from "../src/data/workflow-details";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment. " +
      "Copy .env.example to .env.local and fill in your Supabase project's values.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SEED_DIR = join(process.cwd(), "supabase", "seed");

interface SeedTable {
  file: string;
  table: string;
  /** Column(s) upsert conflicts are resolved on. */
  onConflict: string;
}

const TABLES: SeedTable[] = [
  { file: "categories.json", table: "categories", onConflict: "slug" },
  { file: "integrations.json", table: "integrations", onConflict: "slug" },
  { file: "faqs.json", table: "faqs", onConflict: "scope,question" },
  { file: "testimonials.json", table: "testimonials", onConflict: "author_name,company" },
];

/**
 * Generates the next 14 weekdays of 30-minute booking slots, 9am–5pm,
 * in UTC (Section 9.4's booking calendar converts to the visitor's local
 * timezone for display; storage stays UTC). Re-running this is safe: it
 * only inserts slots that don't already exist for a given start time.
 */
async function seedBookingSlots(): Promise<void> {
  const slots: { starts_at: string; ends_at: string; capacity: number }[] = [];
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() + 1); // start tomorrow

  let weekdaysAdded = 0;
  while (weekdaysAdded < 14) {
    const dow = day.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (dow !== 0 && dow !== 6) {
      for (let halfHour = 18; halfHour < 34; halfHour += 1) {
        // 9:00 (18 half-hours) through 17:00 (34 half-hours) UTC
        const start = new Date(day);
        start.setUTCMinutes(halfHour * 30);
        const end = new Date(start);
        end.setUTCMinutes(end.getUTCMinutes() + 30);
        slots.push({ starts_at: start.toISOString(), ends_at: end.toISOString(), capacity: 1 });
      }
      weekdaysAdded += 1;
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }

  // Insert only slots that don't already exist at that starts_at, so
  // re-running the seed script doesn't create duplicates or reset
  // capacity/booked counts on slots people have already reserved.
  const { data: existing, error: existingError } = await supabase
    .from("booking_slots")
    .select("starts_at")
    .gte("starts_at", slots[0]?.starts_at ?? new Date().toISOString());

  if (existingError) {
    throw new Error(`Failed reading existing booking_slots: ${existingError.message}`);
  }

  const existingTimes = new Set((existing ?? []).map((row) => row.starts_at as string));
  const toInsert = slots.filter((slot) => !existingTimes.has(slot.starts_at));

  if (toInsert.length === 0) {
    console.log("  ok    booking_slots (0 new — already seeded for this window)");
    return;
  }

  const { error } = await supabase.from("booking_slots").insert(toInsert);
  if (error) {
    throw new Error(`Failed seeding booking_slots: ${error.message}`);
  }
  console.log(`  ok    booking_slots (${toInsert.length} new rows)`);
}

function loadJson(file: string): unknown[] {
  const path = join(SEED_DIR, file);
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${file} must contain a JSON array at the top level.`);
  }
  return parsed;
}

async function seedTable({ file, table, onConflict }: SeedTable): Promise<void> {
  let rows: unknown[];
  try {
    rows = loadJson(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`  skip  ${file} not found yet`);
      return;
    }
    throw error;
  }

  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    throw new Error(`Failed seeding "${table}" from ${file}: ${error.message}`);
  }

  console.log(`  ok    ${table} (${rows.length} rows) ← ${file}`);
}


/**
 * Seeds the 12 launch workflows into Postgres from the same TypeScript
 * content the marketing/product pages render (single source of truth —
 * no duplicated workflows.json to drift), plus their junction rows, node
 * docs, how-to steps, per-workflow FAQs, and — for downloads — uploads each
 * sanitized JSON to the private `workflow-json` bucket and records a
 * `workflow_versions` row with its sha256. Requires `pnpm generate:workflows`
 * to have been run first so n8n/workflows/*.json + manifest.json exist.
 */
async function seedWorkflows(): Promise<void> {
  const manifestPath = join(process.cwd(), "n8n", "workflows", "manifest.json");
  let manifest: { slug: string; file: string; sha256: string }[];
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    console.warn("  skip  workflows (run `pnpm generate:workflows` first)");
    return;
  }

  const { data: cats } = await supabase.from("categories").select("id, slug");
  const { data: ints } = await supabase.from("integrations").select("id, slug");
  const catId = new Map((cats ?? []).map((c) => [c.slug as string, c.id as string]));
  const intId = new Map((ints ?? []).map((i) => [i.slug as string, i.id as string]));

  for (const wf of getAllWorkflowDetails()) {
    const { data: row, error } = await supabase
      .from("workflows")
      .upsert(
        {
          slug: wf.slug,
          title: wf.title,
          subtitle: wf.subtitle,
          summary: wf.summary,
          description_md: wf.descriptionMd,
          status: "published",
          price_cents: wf.price.amountCents,
          currency: wf.price.currency,
          vip_included: wf.vipIncluded,
          roi_hours_per_week: wf.roiHoursPerWeek,
          difficulty: wf.difficulty,
          setup_minutes: wf.setupMinutes,
          node_count: wf.nodeCount,
          n8n_min_version: wf.n8nMinVersion,
          requirements: wf.requirements,
          sandbox_supported: wf.sandboxSupported,
          current_version: wf.currentVersion,
          published_at: wf.publishedAt,
          popularity_score: wf.popularityScore,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error || !row) throw new Error(`workflows upsert failed for ${wf.slug}: ${error?.message}`);
    const id = row.id as string;

    await supabase.from("workflow_categories").delete().eq("workflow_id", id);
    await supabase.from("workflow_categories").insert(
      wf.categories.flatMap((c) => (catId.has(c) ? [{ workflow_id: id, category_id: catId.get(c)! }] : [])),
    );

    await supabase.from("workflow_integrations").delete().eq("workflow_id", id);
    await supabase.from("workflow_integrations").insert(
      wf.integrations.flatMap((i) =>
        intId.has(i) ? [{ workflow_id: id, integration_id: intId.get(i)!, role: "both" }] : [],
      ),
    );

    await supabase.from("workflow_nodes_doc").delete().eq("workflow_id", id);
    await supabase.from("workflow_nodes_doc").insert(
      wf.nodes.map((n, sort) => ({
        workflow_id: id,
        node_name: n.name,
        node_type: n.type,
        purpose: n.purpose,
        credentials_needed: n.credentialsNeeded,
        config_notes_md: n.notes,
        sort,
      })),
    );

    await supabase.from("workflow_howto_steps").delete().eq("workflow_id", id);
    await supabase.from("workflow_howto_steps").insert(
      wf.howToSteps.map((s) => ({ workflow_id: id, step: s.step, name: s.name, text: s.text })),
    );

    await supabase.from("faqs").delete().eq("scope", "workflow").eq("scope_ref", id);
    await supabase.from("faqs").insert(
      wf.faqs.map((f, sort) => ({
        scope: "workflow",
        scope_ref: id,
        question: f.question,
        answer_md: f.answerMd,
        answer_plain: f.answerPlain,
        sort,
      })),
    );

    const entry = manifest.find((m) => m.slug === wf.slug);
    if (!entry) {
      console.warn(`  warn  no manifest entry for ${wf.slug}; skipping version upload`);
      continue;
    }
    const storagePath = `${wf.slug}/${wf.currentVersion}.json`;
    const body = readFileSync(join(process.cwd(), "n8n", "workflows", entry.file));
    const { error: uploadError } = await supabase.storage
      .from("workflow-json")
      .upload(storagePath, body, { upsert: true, contentType: "application/json" });
    if (uploadError) throw new Error(`upload failed for ${wf.slug}: ${uploadError.message}`);

    const { error: versionError } = await supabase.from("workflow_versions").upsert(
      {
        workflow_id: id,
        version: wf.currentVersion,
        storage_path: storagePath,
        sha256: entry.sha256,
        changelog_md: "Initial release.",
        n8n_min_version: wf.n8nMinVersion,
      },
      { onConflict: "workflow_id,version" },
    );
    if (versionError) throw new Error(`workflow_versions upsert failed for ${wf.slug}: ${versionError.message}`);
  }
  console.log("  ok    workflows (12) + junctions, docs, steps, FAQs, versions, storage");
}

async function main() {
  console.log(`Seeding ${SUPABASE_URL} …`);
  for (const table of TABLES) {
    await seedTable(table);
  }
  await seedWorkflows();
  await seedBookingSlots();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
