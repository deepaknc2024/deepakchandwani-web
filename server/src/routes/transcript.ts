import { Router } from 'express';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string };
}

interface TranscriptLine {
  start: number;
  dur: number;
  text: string;
}

function parseJSON3(data: {
  events?: Array<{
    tStartMs: number;
    dDurationMs?: number;
    segs?: Array<{ utf8?: string }>;
  }>;
}): TranscriptLine[] {
  if (!data.events) return [];
  return data.events
    .filter((ev) => ev.segs && ev.segs.some((s) => s.utf8?.trim()))
    .map((ev) => ({
      start: ev.tStartMs / 1000,
      dur: (ev.dDurationMs || 0) / 1000,
      text: (ev.segs || [])
        .map((s) => s.utf8 || '')
        .join('')
        .replace(/\n/g, ' ')
        .trim(),
    }))
    .filter((l) => l.text && l.text !== '\n');
}

function parseXML(xml: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  const regex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = match[3]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n/g, ' ')
      .trim();
    if (text) {
      lines.push({
        start: parseFloat(match[1]),
        dur: parseFloat(match[2]),
        text,
      });
    }
  }
  return lines;
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  return (
    tracks.find((t) => t.languageCode === 'en' && !t.kind) ||
    tracks.find((t) => t.languageCode === 'en') ||
    tracks.find((t) => t.languageCode?.startsWith('en')) ||
    tracks[0] ||
    null
  );
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ── Method 1: Fetch watch page HTML and extract captions ─────────────

async function fetchViaWatchPage(
  videoId: string
): Promise<{ lines: TranscriptLine[]; title: string; tracks: CaptionTrack[] }> {
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) throw new Error(`YouTube returned ${resp.status}`);
  const html = await resp.text();

  // Extract title
  const titleMatch =
    html.match(/"title":"((?:[^"\\]|\\.)*)","lengthSeconds"/) ||
    html.match(/<title>(.+?)\s*[-–|]\s*YouTube<\/title>/);
  let title = 'Untitled Video';
  if (titleMatch) {
    try {
      title = JSON.parse('"' + titleMatch[1] + '"');
    } catch {
      title = titleMatch[1];
    }
  }

  // Extract ytInitialPlayerResponse using bracket counting (regex is too slow on 1MB+ HTML)
  const marker = 'ytInitialPlayerResponse';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) {
    if (html.includes('Sign in to confirm your age') || html.includes('signIn')) {
      throw new Error('AGE_RESTRICTED');
    }
    throw new Error('NO_PLAYER_RESPONSE');
  }

  const jsonStart = html.indexOf('{', markerIdx);
  if (jsonStart === -1) throw new Error('NO_PLAYER_RESPONSE');

  // Find matching closing brace using bracket counting
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) {
        jsonEnd = i + 1;
        break;
      }
    }
  }
  if (jsonEnd === -1) throw new Error('PARSE_ERROR');

  let playerData;
  try {
    playerData = JSON.parse(html.substring(jsonStart, jsonEnd));
  } catch {
    throw new Error('PARSE_ERROR');
  }

  const tracks: CaptionTrack[] =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  if (!tracks.length) {
    throw new Error('NO_CAPTIONS');
  }

  const track = pickTrack(tracks);
  if (!track) throw new Error('NO_CAPTIONS');

  // Fetch the caption track (try JSON3 first, then XML)
  let lines: TranscriptLine[] = [];

  for (const fmt of ['json3', ''] as const) {
    try {
      const captionUrl = fmt
        ? `${track.baseUrl}&fmt=${fmt}`
        : track.baseUrl;
      const capResp = await fetch(captionUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });
      if (!capResp.ok) continue;
      const body = await capResp.text();
      lines = fmt === 'json3' ? parseJSON3(JSON.parse(body)) : parseXML(body);
      if (lines.length) break;
    } catch {
      continue;
    }
  }

  return { lines, title, tracks };
}

// ── Method 2: InnerTube API ──────────────────────────────────────────

async function fetchViaInnerTube(
  videoId: string
): Promise<{ lines: TranscriptLine[]; title: string }> {
  const apiUrl = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240101.00.00',
          hl: 'en',
          gl: 'US',
        },
      },
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!resp.ok) throw new Error(`InnerTube returned ${resp.status}`);
  const data = await resp.json();

  const title = data?.videoDetails?.title || 'Untitled Video';
  const tracks: CaptionTrack[] =
    data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  if (!tracks.length) throw new Error('NO_CAPTIONS');

  const track = pickTrack(tracks);
  if (!track) throw new Error('NO_CAPTIONS');

  let lines: TranscriptLine[] = [];
  for (const fmt of ['json3', ''] as const) {
    try {
      const captionUrl = fmt
        ? `${track.baseUrl}&fmt=${fmt}`
        : track.baseUrl;
      const capResp = await fetch(captionUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });
      if (!capResp.ok) continue;
      const body = await capResp.text();
      lines = fmt === 'json3' ? parseJSON3(JSON.parse(body)) : parseXML(body);
      if (lines.length) break;
    } catch {
      continue;
    }
  }

  return { lines, title };
}

// ── Main API endpoint ────────────────────────────────────────────────

router.get('/transcript', async (req, res) => {
  const url = req.query.url as string | undefined;
  if (!url) {
    return res.status(400).json({ ok: false, error: 'Missing url parameter' });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ ok: false, error: 'Invalid YouTube URL' });
  }

  let lines: TranscriptLine[] = [];
  let title = 'Untitled Video';
  const errors: string[] = [];

  // Method 1: Watch page HTML parse
  try {
    const result = await fetchViaWatchPage(videoId);
    lines = result.lines;
    title = result.title;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    errors.push(`WatchPage: ${msg}`);
    console.log(`[transcript] Watch page failed for ${videoId}: ${msg}`);
  }

  // Method 2: InnerTube API
  if (!lines.length) {
    try {
      const result = await fetchViaInnerTube(videoId);
      lines = result.lines;
      title = result.title || title;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`InnerTube: ${msg}`);
      console.log(`[transcript] InnerTube failed for ${videoId}: ${msg}`);
    }
  }

  if (!lines.length) {
    const errorDetail = errors.join('; ');
    let userMessage = 'No captions found for this video.';
    if (errorDetail.includes('AGE_RESTRICTED')) {
      userMessage = 'This video is age-restricted and requires sign-in.';
    } else if (errorDetail.includes('NO_CAPTIONS')) {
      userMessage = 'This video has no captions/subtitles available. The creator may have disabled them.';
    } else if (errorDetail.includes('NO_PLAYER_RESPONSE')) {
      userMessage = 'Could not load video data from YouTube. The video may be private or removed.';
    }
    return res.status(404).json({ ok: false, error: userMessage, debug: errorDetail });
  }

  // Deduplicate consecutive identical lines
  lines = lines.filter(
    (l, i) => i === 0 || l.text.toLowerCase() !== lines[i - 1].text.toLowerCase()
  );

  res.json({
    ok: true,
    videoId,
    title,
    lines,
    lineCount: lines.length,
    wordCount: lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0),
  });
});

// Keep the old proxy endpoint for backwards compat
router.get('/transcript-proxy', async (req, res) => {
  const url = req.query.url as string | undefined;
  const ALLOWED_PATTERN = /^https:\/\/(www\.)?youtube\.com\/api\/timedtext\?/;

  if (!url || !ALLOWED_PATTERN.test(url)) {
    return res.status(400).json({ ok: false, error: 'Invalid URL' });
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    const body = await upstream.text();
    const parsed = new URL(url);
    const fmt = parsed.searchParams.get('fmt');
    res.setHeader('Content-Type', fmt === 'json3' ? 'application/json' : 'text/vtt');
    res.send(body);
  } catch (err) {
    console.error('Transcript proxy error:', err);
    res.status(502).json({ ok: false, error: 'Failed to fetch transcript' });
  }
});

export default router;
