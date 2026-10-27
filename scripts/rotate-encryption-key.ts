import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { requireEnv, serviceClient } from './lib/load';

/**
 * Re-encrypts n8n_instances API keys from OLD_KEY_BASE64 to NEW_KEY_BASE64.
 * Dry-run by default. Pass --apply to write. Aborts without writing if ANY row fails to decrypt.
 * Column encoding defaults to base64; use --encoding=hex if lib/crypto.ts stores hex.
 */
const encoding: BufferEncoding = process.argv.includes('--encoding=hex') ? 'hex' : 'base64';
const apply = process.argv.includes('--apply');

const key = (name: string): Buffer => {
  const b = Buffer.from(requireEnv(name), 'base64');
  if (b.length !== 32) throw new Error(`${name} must decode to 32 bytes`);
  return b;
};

function decrypt(k: Buffer, ct: string, iv: string, tag: string): string {
  const d = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, encoding));
  d.setAuthTag(Buffer.from(tag, encoding));
  return Buffer.concat([d.update(Buffer.from(ct, encoding)), d.final()]).toString('utf8');
}
function encrypt(k: Buffer, plain: string): { ct: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return { ct: ct.toString(encoding), iv: iv.toString(encoding), tag: c.getAuthTag().toString(encoding) };
}

async function main(): Promise<void> {
  const oldKey = key('OLD_KEY_BASE64');
  const newKey = key('NEW_KEY_BASE64');
  const newId = process.env.NEW_KEY_ID ?? 'v2';
  const db = serviceClient();
  const { data, error } = await db.from('n8n_instances').select('id,api_key_ciphertext,api_key_iv,api_key_tag,key_id').neq('key_id', newId);
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const planned: { id: string; ct: string; iv: string; tag: string }[] = [];
  for (const r of rows as { id: string; api_key_ciphertext: string; api_key_iv: string; api_key_tag: string }[]) {
    let plain: string;
    try {
      plain = decrypt(oldKey, r.api_key_ciphertext, r.api_key_iv, r.api_key_tag);
    } catch {
      console.error(`row ${r.id}: cannot decrypt with OLD_KEY (wrong key or wrong --encoding). Aborting; nothing written.`);
      process.exit(1);
    }
    const e = encrypt(newKey, plain);
    if (decrypt(newKey, e.ct, e.iv, e.tag) !== plain) throw new Error(`row ${r.id}: round-trip check failed`);
    planned.push({ id: r.id, ...e });
  }
  console.log(`${planned.length} row(s) to rotate to key_id=${newId} (${apply ? 'APPLYING' : 'dry run'})`);
  if (!apply) return;
  for (const p of planned) {
    const { error: upErr } = await db.from('n8n_instances').update({ api_key_ciphertext: p.ct, api_key_iv: p.iv, api_key_tag: p.tag, key_id: newId }).eq('id', p.id);
    if (upErr) throw new Error(`row ${p.id}: ${upErr.message}`);
  }
  console.log('done. Deploy the new ENCRYPTION_KEY_BASE64 now; keep the old key until every row shows the new key_id.');
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
