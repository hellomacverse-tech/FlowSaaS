import { JsonLd } from '@/components/seo/JsonLd';
import { PseoBreadcrumbs } from './PseoBreadcrumbs';
import { PairDiagram } from './PairDiagram';
import { buildPairGraph } from '@/lib/schema/pair';
import { pairLinks } from '@/lib/pseo/links';
import type { PairViewModel } from '@/lib/pseo/view-model';

const CARD = 'rounded-2xl border border-line/70 bg-white shadow-sm';
const H2 = 'font-display text-3xl font-bold';
const BTN = 'inline-flex min-h-11 items-center rounded-xl px-5 font-semibold focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2';

export function PairPage({ vm, siteUrl }: { vm: PairViewModel; siteUrl: string }) {
  const { pair, a, b, workflows, related, tldr, limits } = vm;
  const links = pairLinks(vm);
  return (
    <main id="main" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <JsonLd data={buildPairGraph(vm, siteUrl)} />
      <PseoBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Integrations', href: '/integrations' }, { label: `${a.name} to ${b.name}` }]} />
      <h1 className="font-display text-[length:var(--text-h1,2.5rem)] font-extrabold">Connect {a.name} to {b.name} with n8n</h1>
      <p className="mt-4 max-w-[68ch] text-lg text-ink-2">{pair.intro_md}</p>

      <section aria-labelledby="tldr" className="mt-10">
        <div className={`${CARD} p-6`}>
          <h2 id="tldr" className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">TL;DR</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><dt className="font-semibold">What it does</dt><dd>{tldr.what}</dd></div>
            <div><dt className="font-semibold">Best for</dt><dd>{tldr.bestFor}</dd></div>
            <div><dt className="font-semibold">Setup time</dt><dd>{tldr.setup}</dd></div>
            <div><dt className="font-semibold">Difficulty</dt><dd className="capitalize">{tldr.difficulty}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="workflows" className="mt-16">
        <h2 id="workflows" className={H2}>Ready-made workflows</h2>
        {links.workflowCards.length > 0 ? (
          <ul className="mt-6 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {links.workflowCards.map((w) => (
              <li key={w.slug} className={`${CARD} flex flex-col p-6`}>
                <h3 className="text-lg font-semibold"><a className="hover:underline focus-visible:ring-2 focus-visible:ring-violet-500" href={`/workflows/${w.slug}`}>{w.title}</a></h3>
                <p className="mt-2 text-sm text-ink-2">{w.summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${CARD} mt-6 p-6`}>
            <p>No ready-made workflow covers {a.name} to {b.name} yet.</p>
            <a className={`${BTN} mt-4 bg-ink text-white`} href={`/services?integrations=${pair.slug}#quote`}>Request this workflow</a>
          </div>
        )}
      </section>

      <section aria-labelledby="how" className="mt-16">
        <h2 id="how" className={H2}>How the integration works</h2>
        <PairDiagram a={a} b={b} mapping={pair.field_mapping.slice(0, 3)} />
      </section>

      <section aria-labelledby="usecases" className="mt-16">
        <h2 id="usecases" className={H2}>Top use cases</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-2">
          {pair.use_cases.map((u) => (
            <li key={u.title} className={`${CARD} p-6`}><h3 className="text-xl font-semibold">{u.title}</h3><p className="mt-2 text-ink-2">{u.body}</p></li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="mapping" className="mt-16">
        <h2 id="mapping" className={H2}>Field mapping</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr><th scope="col" className="py-2 pr-4">{a.name} field</th><th scope="col" className="py-2 pr-4">{b.name} column or field</th><th scope="col" className="py-2 pr-4">Transformation</th><th scope="col" className="py-2">Example</th></tr></thead>
            <tbody>
              {pair.field_mapping.map((f) => (
                <tr key={f.sourceField + f.targetField} className="border-t border-line/70">
                  <td className="py-3 pr-4">{f.sourceField}</td><td className="py-3 pr-4">{f.targetField}</td><td className="py-3 pr-4">{f.transform}</td><td className="py-3 font-mono text-xs">{f.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="steps" className="mt-16">
        <h2 id="steps" className={H2}>Set it up in 5 steps</h2>
        <ol className="mt-6 space-y-4">
          {pair.steps.map((s, i) => (
            <li key={s.name} id={`step-${i + 1}`} className={`${CARD} p-5`}><h3 className="font-semibold">{i + 1}. {s.name}</h3><p className="mt-1 text-ink-2">{s.text}</p></li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="limits" className="mt-16">
        <h2 id="limits" className={H2}>Limits and considerations</h2>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-ink-2">{limits.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>

      <section aria-labelledby="faq" className="mt-16">
        <h2 id="faq" className={H2}>Frequently asked questions</h2>
        {/* All answers are in the HTML (not lazy); they match the FAQPage JSON-LD 1:1. */}
        <dl className="mt-6 space-y-6">
          {pair.faq.map((f) => (<div key={f.question}><dt className="font-semibold">{f.question}</dt><dd className="mt-1 text-ink-2">{f.answer}</dd></div>))}
        </dl>
      </section>

      <nav aria-labelledby="related" className="mt-16">
        <h2 id="related" className={H2}>Related integrations</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {related.map((r) => (<li key={r.slug}><a className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4 hover:bg-surface" href={`/integrations/${r.slug}`}>{r.label}</a></li>))}
          <li><a className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4" href={`/integrations/${a.slug}`}>{a.name} hub</a></li>
          <li><a className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-4" href={`/integrations/${b.slug}`}>{b.name} hub</a></li>
        </ul>
      </nav>

      <aside aria-label="Next steps" className="mt-16 flex flex-wrap gap-3">
        <a className={`${BTN} bg-ink text-white`} href="/workflows">Browse {a.name} workflows</a>
        <a className={`${BTN} border border-ink/15 bg-white text-ink hover:bg-surface`} href="/services#book">Book a setup call</a>
      </aside>
    </main>
  );
}
