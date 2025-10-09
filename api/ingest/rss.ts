import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Parser from 'rss-parser';

const FEEDS: string[] = [
  'https://raoulpal.substack.com/feed',
  'https://www.notboring.co/feed',
  'https://www.blockworks.co/feed',
  'https://thedefiant.io/feed',
  'https://www.economist.com/finance-and-economics/rss.xml'
];

function guidOrHash(link?: string, guid?: string) {
  if (guid && String(guid).trim()) return String(guid);
  if (link && String(link).trim()) return crypto.createHash('sha1').update(String(link)).digest('hex');
  return crypto.randomBytes(8).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Array<{feed: string; ok: boolean; inserted: number; error?: string}> = [];
  let totalInserted = 0;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !service) {
      return res.status(500).json({ ok:false, stage:'env', error:'Missing Supabase admin envs' });
    }

    // Service-role client (bypasses RLS for server writes)
    const supabase = createClient(url, service, { auth: { persistSession: false }, db: { schema: 'public' } });

    // rss-parser with a UA to avoid 403s
    let parser: Parser;
    try {
      parser = new Parser({
        timeout: 15000,
        requestOptions: {
          headers: {
            'user-agent': 'MarketMindsBot/1.0 (+https://market-mind-hive.vercel.app)'
          }
        }
      });
    } catch (e:any) {
      return res.status(500).json({ ok:false, stage:'parser-init', error: e?.message || String(e) });
    }

    for (const feedUrl of FEEDS) {
      let inserted = 0;
      try {
        const feed = await parser.parseURL(feedUrl);

        for (const item of feed.items || []) {
          const external_id = guidOrHash(item.link, item.guid as any);
          const { error } = await supabase
            .from('items')
            .upsert({
              source_key: 'rss',
              external_id,
              url: item.link || null,
              title: item.title || null,
              author: feed.title || null,
              published_at: (item as any).isoDate || (item as any).pubDate || null,
              meta: { feed: feedUrl }
            }, { onConflict: 'source_key,external_id' });

          if (!error) inserted++;
        }

        results.push({ feed: feedUrl, ok: true, inserted });
        totalInserted += inserted;
      } catch (e:any) {
        results.push({ feed: feedUrl, ok: false, inserted: 0, error: e?.message || String(e) });
      }
    }

    return res.status(200).json({ ok: true, inserted: totalInserted, results });
  } catch (e:any) {
    return res.status(500).json({ ok:false, stage:'catch', error: e?.message || String(e), results });
  }
}
