import { Router } from 'express';

const ALLOWED_PREFIX = /^https:\/\/www\.youtube\.com\/api\/timedtext\?/;

const router = Router();

router.get('/transcript-proxy', async (req, res) => {
  const url = req.query.url as string | undefined;

  if (!url || !ALLOWED_PREFIX.test(url)) {
    return res.status(400).json({ ok: false, error: 'Invalid or disallowed URL' });
  }

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();

    // Determine content type from the URL's fmt parameter
    const parsed = new URL(url);
    const fmt = parsed.searchParams.get('fmt');
    const contentType = fmt === 'json3' ? 'application/json' : 'text/vtt';

    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    console.error('Transcript proxy error:', err);
    res.status(502).json({ ok: false, error: 'Failed to fetch transcript' });
  }
});

export default router;
