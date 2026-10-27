import { catalogSeed } from '../src/data/catalog-seed';
import { auditPages } from '../src/lib/pseo/audit-core';
import { evaluatePair } from '../src/lib/pseo/evaluate';
import type { CatalogEntry } from '../src/lib/pseo/build-context';
import { loadPairsAndIntegrations, sourceFromArgs } from './lib/load';

async function main(): Promise<void> {
  const source = sourceFromArgs(process.argv);
  const { pairs, integrations } = await loadPairsAndIntegrations(source);
  const byId = new Map(integrations.map((i) => [i.id, i]));
  const catalog = catalogSeed as unknown as readonly CatalogEntry[];
  const indexable = pairs.filter((p) => p.indexable);
  const problems: string[] = [];
  const pages: { slug: string; template: string; editorial: string }[] = [];

  for (const p of indexable) {
    const a = byId.get(p.source_integration);
    const b = byId.get(p.target_integration);
    if (!a || !b) {
      problems.push(`${p.slug}: dangling integration reference`);
      continue;
    }
    const ev = evaluatePair(p, a, b, catalog, pairs, byId);
    for (const x of ev.problems) problems.push(`${p.slug}: ${x}`);
    if (p.quality_score !== ev.score) problems.push(`${p.slug}: stored quality_score ${p.quality_score} != computed ${ev.score} (re-run promote)`);
    pages.push({ slug: p.slug, template: ev.vm.text.template, editorial: ev.vm.text.editorial });
  }
  for (const v of auditPages(pages)) problems.push(`${v.slug}: ${v.rule} (${v.detail})`);

  console.log(`audit-pseo [${source}]: ${indexable.length} indexable page(s), ${problems.length} problem(s)`);
  for (const x of problems) console.error(` - ${x}`);
  process.exit(problems.length ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(2);
});
