import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type OgFont = { name: string; data: ArrayBuffer; weight: 500 | 800; style: 'normal' };
let cache: Promise<OgFont[]> | null = null;

const toArrayBuffer = (b: Buffer): ArrayBuffer =>
  b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** Satori does not support WOFF2: commit TTF files (OFL-licensed Google Fonts) to src/assets/fonts. */
export function ogFonts(): Promise<OgFont[]> {
  cache ??= Promise.all([
    readFile(join(process.cwd(), 'src/assets/fonts/PlusJakartaSans-800.ttf')),
    readFile(join(process.cwd(), 'src/assets/fonts/Inter-500.ttf')),
  ]).then(([d, b]) => [
    { name: 'Plus Jakarta Sans', data: toArrayBuffer(d), weight: 800, style: 'normal' },
    { name: 'Inter', data: toArrayBuffer(b), weight: 500, style: 'normal' },
  ]);
  return cache;
}
