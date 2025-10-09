import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;   // e.g. https://xxxx.supabase.co
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;      // <-- Edge Function expects this in Authorization
    if (!supabaseUrl || !anon) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase envs' });
    }

    // Derive project ref from URL
    const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i);
    if (!match) {
      return res.status(500).json({ ok: false, error: 'Could not parse Supabase project ref from URL' });
    }
    const projectRef = match[1];

    // Adjust this if your function has a different name
    const fnUrl = `https://${projectRef}.functions.supabase.co/content-aggregator`;

    const r = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        // Edge Functions validate this as a JWT (anon key works)
        Authorization: `Bearer ${anon}`,
        apikey: anon,                            // recommended by Supabase examples
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'full' })     // pass whatever params your function expects
    });

    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    if (!r.ok) {
      return res
        .status(r.status)
        .json({ ok: false, status: r.status, error: (json && (json.error || json)) || text });
    }

    return res.status(200).json({ ok: true, result: json ?? text });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
