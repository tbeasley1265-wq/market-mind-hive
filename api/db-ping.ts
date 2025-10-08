import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !anon) return res.status(500).json({ ok:false, error:'Missing Supabase envs' });

    const supabase = createClient(url, anon);
    const { data, error } = await supabase.from('items').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ ok:true, itemsSeen: data?.length ?? 0 });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: String(e?.message || e) });
  }
}
