import type { VercelRequest, VercelResponse } from '@vercel/node';
import Parser from 'rss-parser';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../../src/server/supabase';

const FEEDS: string[] = [
  'https://raoulpal.substack.com/feed',
  'https://www.notboring.co/feed',
  'https://www.blockworks.co/feed',
  'https://thedefiant.io/feed',
  'https://www.economist.com/finance-and-economics/rss.xml'
];

function guidOrHash(link?: string, guid?: string) {
  if (guid && guid.trim().length > 0) return guid;
  if (link && link.trim().length > 0) return crypto.createHash('sha1').update(link).digest('hex');
  return crypto.randomBytes(8).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = getSupabaseAdmin();
    const parser = new Parser({ timeout: 15000 });

    let inserted = 0;
    for (const url of FEEDS) {
      try {
        const feed = await parser.parseURL(url);
        for (const item of feed.items || []) {
          const external_id = guidOrHash(item.link, item.guid as string | undefined);
          const { error } = await supabase
            .from('items')
            .upsert({
              source_key: 'rss',
              external_id,
              url: item.link || null,
              title: item.title || null,
              author: feed.title || null,
              published_at: item.isoDate || item.pubDate || null,
              meta: { feed: url }
            }, { onConflict: 'source_key,external_id' });

          if (!error) inserted++;
        }
      } catch (e) {
        // continue to next feed
      }
    }

    res.status(200).json({ ok: true, inserted });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
