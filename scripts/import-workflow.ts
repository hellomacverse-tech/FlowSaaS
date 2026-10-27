import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const [slug, exportPath, n8nVersion] = process.argv.slice(2);
if (!slug || !exportPath || !n8nVersion) {
  console.error('usage: tsx scripts/import-workflow.ts <slug> <path-to-n8n-export.json> <n8n-version>');
  process.exit(2);
}

const MANIFEST = 'n8n/workflows/manifest.json';
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
  workflows: { slug: string; sha256?: string; isSkeleton?: boolean; testedWithN8n?: string }[];
};
const entry = manifest.workflows.find((w) => w.slug === slug);
if (!entry) {
  console.error(`slug "${slug}" is not in ${MANIFEST}`);
  process.exit(1);
}
const json: unknown = JSON.parse(readFileSync(exportPath, 'utf8'));
const text = `${JSON.stringify(json, null, 2)}\n`;
writeFileSync(`n8n/workflows/${slug}.json`, text);
entry.sha256 = createHash('sha256').update(text).digest('hex');
entry.isSkeleton = false;
entry.testedWithN8n = n8nVersion;
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${slug}: imported (n8n ${n8nVersion}). Now run: pnpm sanitize:workflows`);
console.log('If sanitize reports a hash mismatch, your generator hashes a different serialisation; align it with this one.');
