import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../src/server/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('items').insert({
      source_key: 'rss',
      external_id: 'manual-' + Date.now(),
      url: 'https://example.com/post',
      title: 'Hello World',
      author: 'Seed',
      published_at: new Date().toISOString(),
      meta: { seed: true }
    });
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok:false, error: String(e?.message || e) });
  }
}
