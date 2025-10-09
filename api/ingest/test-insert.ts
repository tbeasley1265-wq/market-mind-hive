import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !service) {
      return res.status(500).json({
        ok: false,
        error: 'Missing Supabase envs',
        supabaseUrlPresent: !!url,
        supabaseServiceRolePresent: !!service,
      });
    }

    const supabase = createClient(url, service, {
      auth: { persistSession: false },
      db: { schema: 'public' },
    });

    // Pre-count (optional)
    const pre = await supabase.from('items').select('id', { count: 'exact', head: true });
    if (pre.error) throw pre.error;

    // Insert one test row
    const ins = await supabase.from('items').insert({
      source_key: 'rss',
      external_id: 'manual-' + Date.now(),
      url: 'https://example.com/post',
      title: 'Hello World',
      author: 'Seed',
      published_at: new Date().toISOString(),
      meta: { seed: true },
    });
    if (ins.error) throw ins.error;

    // Post-count (optional)
    const post = await supabase.from('items').select('id', { count: 'exact', head: true });
    if (post.error) throw post.error;

    return res.status(200).json({
      ok: true,
      preCount: pre.count ?? null,
      postCount: post.count ?? null,
      delta: (post.count ?? 0) - (pre.count ?? 0),
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
