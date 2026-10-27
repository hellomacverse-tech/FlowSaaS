import type { IntegrationRow, FieldMapping } from '@/lib/pseo/schemas';

/** Static SVG, no JS. */
export function PairDiagram({ a, b, mapping }: { a: IntegrationRow; b: IntegrationRow; mapping: FieldMapping[] }) {
  const box = (x: number, label: string, fill: string) => (
    <g transform={`translate(${x},60)`}>
      <rect width="180" height="72" rx="16" fill="#fff" stroke="#E2E8F0" />
      <rect width="6" height="72" rx="3" fill={fill} />
      <text x="24" y="42" fontSize="15" fontWeight="600" fill="#0F172A">{label}</text>
    </g>
  );
  return (
    <figure className="mt-6 overflow-x-auto">
      <svg role="img" aria-labelledby="pd-t" viewBox="0 0 760 220" className="min-w-[640px]">
        <title id="pd-t">{`${a.name} sends data to n8n, which sends it to ${b.name}`}</title>
        <defs>
          <linearGradient id="pd-g" x1="0" x2="1">
            <stop offset="0" stopColor="#14B8A6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <marker id="pd-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L8 4L0 8z" fill="#8B5CF6" />
          </marker>
        </defs>
        {box(20, a.name, '#FF6B6B')}
        {box(290, 'n8n workflow', '#8B5CF6')}
        {box(560, b.name, '#14B8A6')}
        <path d="M200 96H290" stroke="url(#pd-g)" strokeWidth="2" strokeDasharray="6 6" markerEnd="url(#pd-arrow)" fill="none" />
        <path d="M470 96H560" stroke="url(#pd-g)" strokeWidth="2" strokeDasharray="6 6" markerEnd="url(#pd-arrow)" fill="none" />
        {mapping.map((m, i) => (
          <text key={m.sourceField} x={20 + i * 250} y={170} fontSize="12" fill="#64748B">{`${m.sourceField} → ${m.targetField}`}</text>
        ))}
      </svg>
      <figcaption className="sr-only">Data flows from {a.name} through n8n into {b.name}.</figcaption>
    </figure>
  );
}
