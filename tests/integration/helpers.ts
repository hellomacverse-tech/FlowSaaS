import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const need = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`integration tests need ${n}`);
  return v;
};

export const admin: SupabaseClient = createClient(url, need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

export async function makeUser(label: string): Promise<{ id: string; email: string; client: SupabaseClient }> {
  const email = `${label}-${crypto.randomUUID()}@test.local`;
  const password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? 'createUser failed');
  const client = createClient(url, need('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(signInErr.message);
  return { id: data.user.id, email, client };
}
