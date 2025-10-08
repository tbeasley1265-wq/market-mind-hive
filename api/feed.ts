import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon);

    const limit = Number((req.query.limit as string) || 20);
    const offset = Number((req.query.offset as string) || 0);
    const source = (req.query.source_key as string) || undefined;
    const q = (req.query.q as string) || undefined;

    let query = supabase
      .from('items')
      .select('id, title, author, published_at, url, source_key, meta')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source) query = query.eq('source_key', source);
    if (q) query = query.ilike('title', `%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json({ ok: true, items: data ?? [], limit, offset });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
