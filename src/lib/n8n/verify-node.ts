/**
 * The n8n side of the signing contract: the SOURCE of the Code node that must
 * be the first node after every FlowSaaS-facing Webhook (sandbox + tools).
 * It is a string so the generator can embed it verbatim in the workflow JSON
 * AND so a unit test can execute the very same code against a fake `$input`
 * — the two halves of the protocol are tested against each other, not
 * against my description of each other.
 *
 * Requires in n8n: Webhook node option "Raw Body" = on, env
 * NODE_FUNCTION_ALLOW_BUILTIN=crypto, and FLOWSAAS_SIGNING_SECRET set on the
 * n8n instance. Throwing here makes n8n answer with an error status (401
 * when the webhook is configured "Response: last node" and errors bubble).
 */
export const N8N_VERIFY_CODE = `
const crypto = require('crypto');
const item = $input.first();
const headers = item.json.headers || {};
const secret = $env.FLOWSAAS_SIGNING_SECRET;
if (!secret) throw new Error('401: signing secret not configured');

const timestamp = headers['x-flowsaas-timestamp'];
const nonce = headers['x-flowsaas-nonce'];
const signature = headers['x-flowsaas-signature'];
if (!timestamp || !nonce || !signature) throw new Error('401: missing signature headers');

if (Math.abs(Date.now() - Number(timestamp)) > 60000) throw new Error('401: stale timestamp');

const rawBody = Buffer.from(item.binary.data.data, 'base64').toString('utf8');
const expected = crypto.createHmac('sha256', secret).update(timestamp + '.' + nonce + '.' + rawBody).digest();
let provided;
try { provided = Buffer.from(signature, 'hex'); } catch (e) { throw new Error('401: bad signature'); }
if (provided.length !== expected.length || !crypto.timingSafeEqual(expected, provided)) {
  throw new Error('401: bad signature');
}

const staticData = $getWorkflowStaticData('global');
const seen = staticData.nonces || {};
const now = Date.now();
for (const key of Object.keys(seen)) if (seen[key] < now) delete seen[key];
if (seen[nonce]) throw new Error('401: replayed nonce');
seen[nonce] = now + 120000;
staticData.nonces = seen;

return [{ json: JSON.parse(rawBody) }];
`.trim();
