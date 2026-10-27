import { ImageResponse } from 'next/og';
import { ogFonts } from './fonts';

export interface OgCardProps {
  eyebrow: string;
  title: string;
  chip?: string;
  logos?: (string | null)[];
}
export const OG_SIZE = { width: 1200, height: 630 } as const;
const CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';

/** Satori needs display:flex on every multi-child element and does not support filter:blur. */
export async function renderOg(p: OgCardProps): Promise<ImageResponse> {
  const title = p.title.length > 90 ? `${p.title.slice(0, 87)}…` : p.title;
  const logos = (p.logos ?? []).filter((l): l is string => Boolean(l)).slice(0, 4);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#F8FAFC', fontFamily: 'Inter', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -160, right: -120, width: 560, height: 560, borderRadius: 9999, background: 'radial-gradient(circle at 30% 30%, rgba(255,107,107,0.35), rgba(255,107,107,0) 65%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -140, left: -100, width: 460, height: 460, borderRadius: 9999, background: 'radial-gradient(circle at 30% 30%, rgba(20,184,166,0.32), rgba(20,184,166,0) 65%)', display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(90deg,#14B8A6,#8B5CF6)', display: 'flex' }} />
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 34, color: '#0F172A', display: 'flex' }}>FlowSaaS</div>
          <div style={{ marginLeft: 16, fontSize: 22, color: '#475569', letterSpacing: 2, textTransform: 'uppercase', display: 'flex' }}>{p.eyebrow}</div>
        </div>
        <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: title.length > 60 ? 56 : 68, lineHeight: 1.08, color: '#0F172A', display: 'flex', maxWidth: 1000 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {logos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src.slice(-24)} src={src} width={56} height={56} alt="" style={{ background: '#fff', borderRadius: 14, padding: 8 }} />
          ))}
          {p.chip ? (
            <div style={{ background: '#F0FDFA', color: '#0F766E', fontSize: 24, fontWeight: 500, padding: '10px 20px', borderRadius: 9999, display: 'flex' }}>{p.chip}</div>
          ) : null}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: { 'Cache-Control': CACHE } },
  );
}
