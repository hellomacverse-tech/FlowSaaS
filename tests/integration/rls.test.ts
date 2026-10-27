import { describe, expect, test } from 'vitest';
import { admin, makeUser } from './helpers';

describe('row level security', () => {
  test('every public table has RLS enabled', async () => {
    const { data, error } = await admin.rpc('rls_disabled_tables');
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  test('profile trigger created a license key and free tier', async () => {
    const u = await makeUser('lic');
    const { data } = await admin.from('profiles').select('license_key,tier,credits_included').eq('id', u.id).single();
    expect(data?.license_key).toMatch(/^FSK-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(data?.tier).toBe('free');
  });

  test('user cannot self-promote tier, credits, or license key', async () => {
    const u = await makeUser('promote');
    for (const patch of [{ tier: 'vip' }, { credits_included: 999999 }, { credits_used: 0 }, { license_key: 'FSK-AAAA-AAAA-AAAA-AAAA' }]) {
      const res = await u.client.from('profiles').update(patch).eq('id', u.id);
      expect(res.error, `update ${JSON.stringify(patch)} must be rejected`).not.toBeNull();
    }
    const { data } = await admin.from('profiles').select('tier,credits_included,license_key').eq('id', u.id).single();
    expect(data?.tier).toBe('free');
    expect(data?.credits_included).toBe(50);
    expect(data?.license_key).not.toBe('FSK-AAAA-AAAA-AAAA-AAAA');
  });

  test('user can update allowed profile fields', async () => {
    const u = await makeUser('allowed');
    const res = await u.client.from('profiles').update({ full_name: 'Test Person' }).eq('id', u.id);
    expect(res.error).toBeNull();
  });

  test("user A cannot read user B's private rows", async () => {
    const [a, b] = [await makeUser('a'), await makeUser('b')];
    await admin.from('api_keys').insert({ user_id: b.id, name: 'k', prefix: 'fsk_live_x', key_hash: 'h' });
    for (const table of ['orders', 'subscriptions', 'entitlements', 'downloads', 'tool_runs', 'usage_daily', 'n8n_instances', 'api_keys']) {
      const { data } = await a.client.from(table).select('*').eq('user_id', b.id);
      expect(data ?? [], table).toHaveLength(0);
    }
  });

  test('clients cannot write entitlements or read workflow_versions', async () => {
    const u = await makeUser('writer');
    const { error } = await u.client.from('entitlements').insert({ user_id: u.id, workflow_id: null, source: 'vip' });
    expect(error).not.toBeNull();
    const { data } = await u.client.from('workflow_versions').select('*');
    expect(data ?? []).toHaveLength(0);
  });

  test('review insert requires an entitlement and is forced pending', async () => {
    const u = await makeUser('rev');
    const { data: wf } = await admin.from('workflows').select('id').limit(1).single();
    const denied = await u.client.from('reviews').insert({ workflow_id: wf?.id, user_id: u.id, rating: 5, title: 't', body: 'b' });
    expect(denied.error).not.toBeNull();
    await admin.from('entitlements').insert({ user_id: u.id, workflow_id: wf?.id, source: 'purchase' });
    const ok = await u.client.from('reviews').insert({ workflow_id: wf?.id, user_id: u.id, rating: 5, title: 't', body: 'b', status: 'approved', verified_purchase: true });
    if (!ok.error) {
      const { data } = await admin.from('reviews').select('status,is_seed').eq('user_id', u.id).single();
      expect(data).toMatchObject({ status: 'pending', is_seed: false });
    }
  });

  test('pSEO indexable gate is enforced by the database', async () => {
    const { error } = await admin.from('integration_pairs').update({ indexable: true, quality_score: 40 }).eq('slug', 'shopify-to-slack');
    expect(error?.message ?? '').toMatch(/pairs_indexable_gate/);
  });

  test('case study cannot publish with an unsourced number', async () => {
    const { error } = await admin.from('case_studies').insert({
      slug: `t-${Date.now()}`, title: 't', client_name: 'c', challenge: 'c', solution: 's', verified: true, is_seed: false,
      published: true, published_at: new Date().toISOString(), results: [{ label: 'x', value: '1', source: '' }],
    });
    expect(error?.message ?? '').toMatch(/case_published_requires_proof/);
  });
});
