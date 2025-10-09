import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // e.g. https://xxxx.supabase.co
    const service = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !service) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase envs' });
    }

    // Derive Supabase project ref (subdomain before .supabase.co)
    const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i);
    if (!match) {
      return res.status(500).json({ ok: false, error: 'Could not parse Supabase project ref from URL' });
    }
    const projectRef = match[1];

    // Call your Supabase Edge Function (named `content-aggregator`)
    const fnUrl = `https://${projectRef}.functions.supabase.co/content-aggregator`;

    const r = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${service}`,   // service role token (server-side only)
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'full' })  // adapt params if your function expects different input
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
