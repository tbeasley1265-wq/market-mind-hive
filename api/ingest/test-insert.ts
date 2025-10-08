import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      return res.status(500).json({
        ok: false,
        error: 'Missing Supabase envs',
        supabaseUrlPresent: !!url,
        supabaseAnonPresent: !!anon,
      });
    }

    // Inline client (avoid import-path issues)
    const supabase = createClient(url, anon);

    const { error } = await supabase.from('items').insert({
      source_key: 'rss',
      external_id: 'manual-' + Date.now(),
      url: 'https://example.com/post',
      title: 'Hello World',
      author: 'Seed',
      published_at: new Date().toISOString(),
      meta: { seed: true },
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: e?.message || String(e),
      stack: e?.stack || null,
    });
  }
}
