/** Logos are stored as SVG text. Render as <img src=data:...>: scripts inside an <img> SVG never execute. */
export function svgToDataUri(svg: string | null): string | null {
  if (!svg || !svg.trim().startsWith('<svg') || svg.length > 20_000) return null;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
