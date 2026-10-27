export interface AppNames {
  name: string;
  shortName: string;
}
const SUFFIX = '| FlowSaaS';

/** Always <= 60 characters. Use `title: { absolute }` so the layout template does not double the suffix. */
export function buildPairTitle(a: AppNames, b: AppNames): string {
  const candidates = [
    `${a.name} to ${b.name} n8n Integration: Templates & Setup ${SUFFIX}`,
    `${a.shortName} to ${b.shortName} n8n Integration: Templates & Setup ${SUFFIX}`,
    `${a.shortName} to ${b.shortName} n8n Integration ${SUFFIX}`,
  ];
  return candidates.find((c) => c.length <= 60) ?? (candidates[2] as string).slice(0, 60);
}

/** Always <= 155 characters. A hand-written override wins. */
export function buildPairDescription(a: AppNames, b: AppNames, override: string | null): string {
  if (override) return override.slice(0, 155);
  const mk = (x: string, y: string): string =>
    `Connect ${x} to ${y} with n8n. Get ready-made workflow templates, field mapping, and a step-by-step setup guide. Deploy in minutes.`;
  const full = mk(a.name, b.name);
  return full.length <= 155 ? full : mk(a.shortName, b.shortName).slice(0, 155);
}
