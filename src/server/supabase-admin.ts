import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE!;
  if (!url || !service) throw new Error('Missing Supabase admin envs');
  return createClient(url, service, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
}
