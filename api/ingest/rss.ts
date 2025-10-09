import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, route: '/api/ingest/rss', status: 'alive' });
}
