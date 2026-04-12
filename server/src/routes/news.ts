import { Router } from 'express';
import { config } from '../config.js';

interface CacheEntry {
  data: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const router = Router();

router.get('/news', async (req, res) => {
  const region = req.query.region === 'in' ? 'in' : 'us';
  const cacheKey = `news:${region}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return res.json(cached.data);
  }

  const apiKey = config.guardianApiKey;
  const url =
    region === 'in'
      ? `https://content.guardianapis.com/world/india?api-key=${apiKey}&page-size=8&order-by=newest`
      : `https://content.guardianapis.com/search?section=us-news&api-key=${apiKey}&page-size=8&order-by=newest`;

  try {
    const resp = await fetch(url);
    const json = (await resp.json()) as {
      response?: { results?: Array<{ webTitle?: string; webUrl?: string; webPublicationDate?: string }> };
    };

    const results = json.response?.results ?? [];
    const items = results.map((r) => ({
      title: r.webTitle ?? '',
      link: r.webUrl ?? '',
      date: r.webPublicationDate ?? '',
      src: 'The Guardian',
    }));

    const payload = { ok: true, items };
    cache.set(cacheKey, { data: payload, expires: Date.now() + CACHE_TTL });
    res.json(payload);
  } catch (err) {
    console.error('Guardian API error:', err);
    res.status(502).json({ ok: false, error: 'Failed to fetch news' });
  }
});

export default router;
