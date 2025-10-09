import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;

    // 0) Env sanity
    if (!url || !service) {
      return res.status(500).json({
        ok: false,
        stage: 'env-check',
        supabaseUrlPresent: !!url,
        supabaseServiceRolePresent: !!service,
        error: 'Missing Supabase envs',
      });
    }

    // 1) Admin client (service role bypasses RLS)
    const supabase = createClient(url, service, {
      auth: { persistSession: false },
      db: { schema: 'public' },
    });

    // 2) Read test (prove DB reachable)
    const readTest = await supabase.rpc('pg_sleep', { seconds: 0 }).catch(() => null); // harmless ping
    const countResp = await supabase.from('items').select('id', { count: 'exact', head: true });
    const preCount = (countResp as any)?.count ?? null;
    if ((countResp as any)?.error) {
      return res.status(500).json({
        ok: false,
        stage: 'read-count',
        error: (countResp as any).error?.message || String((countResp as any).error),
      });
    }

    // 3) Insert test row
    const insertResp = await supabase.from('items').insert({
      source_key: 'rss',
      external_id: 'manual-' + Date.now(),
      url: 'https://example.com/post',
      title: 'Hello World',
      author: 'Seed',
      published_at: new Date().toISOString(),
      meta: { seed: true },
    });

    if (insertResp.error) {
      return res.status(500).json({
        ok: false,
        stage: 'insert',
        error: insertResp.error.message,
        details: insertResp.error.details || null,
        hint: insertResp.error.hint || null,
        code: insertResp.error.code || null,
      });
    }

    // 4) Recount
    const postCountResp = await supabase.from('items').select('id', { count: 'exact', head: true });
    const postCount = (postCountResp as any)?.count ?? null;

    return res.status(200).json({
      ok: true,
      stage: 'done',
      preCount,
      postCount,
      delta: (postCount ?? 0) - (preCount ?? 0),
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, stage: 'catch', error: e?.message || String(e) });
  }
}
