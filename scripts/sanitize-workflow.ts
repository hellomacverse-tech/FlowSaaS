/**
 * Run with `pnpm sanitize:workflows`. Exits non-zero if ANY workflow file
 * contains a credentials block, a forbidden/unlisted node type, pinData,
 * exceeds 1 MB, or no longer matches the sha256 recorded in manifest.json
 * (i.e. was edited after generation without regenerating the manifest).
 * Wire this into CI as a release gate.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sha256Hex, validateWorkflow } from "../src/lib/n8n/validate";

const dir = join(process.cwd(), "n8n", "workflows");
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "manifest.json");

let manifest: { file: string; sha256: string }[] = [];
try {
  manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf-8"));
} catch {
  console.error("manifest.json missing — run `pnpm generate:workflows` first.");
  process.exit(1);
}

let failures = 0;

for (const file of files) {
  const raw = readFileSync(join(dir, file), "utf-8");
  const result = validateWorkflow(JSON.parse(raw), Buffer.byteLength(raw));
  const entry = manifest.find((m) => m.file === file);

  const problems = [...result.errors];
  if (!entry) problems.push("not listed in manifest.json");
  else if (entry.sha256 !== sha256Hex(raw)) problems.push("sha256 does not match manifest.json (file edited after generation)");

  if (problems.length > 0) {
    failures += 1;
    console.error(`FAIL ${file}\n  - ${problems.join("\n  - ")}`);
  } else {
    console.log(`ok   ${file}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} workflow file(s) failed the release gate.`);
  process.exit(1);
}
console.log(`\nAll ${files.length} workflow files passed.`);
