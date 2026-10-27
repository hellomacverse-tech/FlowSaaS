import { catalogSeed } from '../src/data/catalog-seed';
import { pairLinks, MAX_LINKS_PER_PAGE, CHROME_LINK_COUNT } from '../src/lib/pseo/links';
import { evaluatePair } from '../src/lib/pseo/evaluate';
import { pairsForWorkflow, topPairsForFooter, type CatalogEntry } from '../src/lib/pseo/build-context';
import { loadPairsAndIntegrations, sourceFromArgs } from './lib/load';

async function main(): Promise<void> {
  const source = sourceFromArgs(process.argv);
  const { pairs, integrations } = await loadPairsAndIntegrations(source);
  const byId = new Map(integrations.map((i) => [i.id, i]));
  const catalog = catalogSeed as unknown as readonly CatalogEntry[];
  const indexable = pairs.filter((p) => p.indexable && !p.redirect_to);
  const problems: string[] = [];
  // Spec asks for >= 2 related pairs; with fewer than 3 indexable pairs that is impossible, so cap it.
  const minRelated = Math.min(2, Math.max(0, indexable.length - 1));

  for (const p of indexable) {
    const a = byId.get(p.source_integration);
    const b = byId.get(p.target_integration);
    if (!a || !b) {
      problems.push(`${p.slug}: dangling integration`);
      continue;
    }
    const { vm } = evaluatePair(p, a, b, catalog, pairs, byId);
    const links = pairLinks(vm);
    if (!links.hrefs.includes(`/integrations/${a.slug}`)) problems.push(`${p.slug}: missing link to hub ${a.slug}`);
    if (!links.hrefs.includes(`/integrations/${b.slug}`)) problems.push(`${p.slug}: missing link to hub ${b.slug}`);
    if (vm.related.length < minRelated) problems.push(`${p.slug}: ${vm.related.length} related pairs < ${minRelated}`);
    if (links.hrefs.length + CHROME_LINK_COUNT > MAX_LINKS_PER_PAGE) {
      problems.push(`${p.slug}: ${links.hrefs.length + CHROME_LINK_COUNT} links > ${MAX_LINKS_PER_PAGE}`);
    }
    // Every workflow this page shows must link back to this pair from its own "Works with" block.
    for (const w of vm.workflows) {
      const back = pairsForWorkflow(w.integrations, pairs, byId).some((r) => r.slug === p.slug);
      if (!back) problems.push(`${p.slug}: workflow ${w.slug} does not link back`);
    }
  }
  for (const f of topPairsForFooter(pairs, byId)) {
    if (!indexable.some((p) => p.slug === f.slug)) problems.push(`footer links non-indexable pair ${f.slug}`);
  }

  console.log(`audit-links [${source}]: ${indexable.length} indexable page(s), ${problems.length} problem(s)`);
  for (const x of problems) console.error(` - ${x}`);
  process.exit(problems.length ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(2);
});
