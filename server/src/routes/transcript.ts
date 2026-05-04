import { Router } from 'express';
import multer from 'multer';
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../config.js';

const router = Router();
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB cap for short voice clips
});

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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function parseXML(xml: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];

  // Format 1: New YouTube format <p t="ms" d="ms">...<s>text</s>...</p>
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const offsetMs = parseInt(match[1], 10);
    const durMs = parseInt(match[2], 10);
    const inner = match[3];
    // Extract text from <s> tags if present, otherwise use raw inner text
    let text = '';
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(inner)) !== null) {
      text += sMatch[1];
    }
    if (!text) text = inner.replace(/<[^>]+>/g, '');
    text = decodeEntities(text).trim();
    if (text) {
      lines.push({ start: offsetMs / 1000, dur: durMs / 1000, text });
    }
  }

  if (lines.length) return lines;

  // Format 2: Old YouTube format <text start="sec" dur="sec">text</text>
  const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = textRegex.exec(xml)) !== null) {
    const text = decodeEntities(match[3].replace(/<[^>]+>/g, '').replace(/\n/g, ' ')).trim();
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

// ── Method 0a: Apify YouTube transcript actor (most reliable, paid-per-use) ──

async function fetchViaApify(
  videoId: string
): Promise<{ lines: TranscriptLine[]; title: string }> {
  if (!config.apifyToken) throw new Error('NO_APIFY_TOKEN');

  const url = `https://api.apify.com/v2/acts/supreme_coder~youtube-transcript-scraper/run-sync-get-dataset-items?token=${config.apifyToken}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls: [{ url: `https://www.youtube.com/watch?v=${videoId}` }],
      languages: ['en', 'hi'],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!resp.ok) throw new Error(`APIFY_HTTP_${resp.status}`);
  const items = await resp.json() as Array<{
    transcript?: Array<{ text: string; start: number; duration: number }>;
    videoDetails?: { title?: string };
    language?: string;
    languageCode?: string;
    errorCode?: string;
    error?: string;
  }>;

  if (!items?.length) throw new Error('APIFY_EMPTY');
  const item = items[0];
  if (item.errorCode) {
    console.log(`[transcript] Apify error: ${item.errorCode} ${item.error?.substring(0, 200)}`);
    throw new Error(item.errorCode === 'TranscriptNotFound' ? 'NO_CAPTIONS' : 'APIFY_ERROR');
  }
  if (!item.transcript?.length) throw new Error('NO_CAPTIONS');

  const lines: TranscriptLine[] = item.transcript.map((t) => ({
    start: t.start,
    dur: t.duration,
    text: t.text.replace(/\n/g, ' ').trim(),
  })).filter((l) => l.text);

  return { lines, title: item.videoDetails?.title || 'Untitled Video' };
}

// ── Method 0: yt-dlp with cookies (bypasses YouTube IP bot detection) ──

async function fetchViaYtDlp(
  videoId: string
): Promise<{ lines: TranscriptLine[]; title: string }> {
  await access(config.ytdlpCookiesPath).catch(() => {
    throw new Error('NO_COOKIES');
  });

  const workDir = await mkdtemp(join(tmpdir(), 'ytdlp-'));
  try {
    const args = [
      '--skip-download',
      '--write-auto-sub',
      '--write-sub',
      '--sub-langs', 'en.*,en,hi.*,hi',
      '--sub-format', 'vtt',
      '--ignore-no-formats-error',
      '--cookies', config.ytdlpCookiesPath,
      '--no-warnings',
      '--print-json',
      '--no-playlist',
      '-o', join(workDir, '%(id)s.%(ext)s'),
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    const { stdout, stderr, code } = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const child = spawn(config.ytdlpPath, args, { timeout: 45000 });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });
      child.on('close', (code) => resolve({ stdout, stderr, code: code ?? -1 }));
      child.on('error', () => resolve({ stdout, stderr, code: -1 }));
    });

    if (code !== 0) {
      console.log(`[transcript] yt-dlp exited ${code}: ${stderr.substring(0, 400)}`);
      if (stderr.includes('not a bot') || stderr.includes('Sign in')) throw new Error('COOKIES_EXPIRED');
      throw new Error(`YT_DLP_FAILED`);
    }

    let title = 'Untitled Video';
    try {
      const meta = JSON.parse(stdout.split('\n').find((l) => l.trim().startsWith('{')) || '{}');
      if (meta.title) title = meta.title;
    } catch { /* ignore */ }

    const files = await readdir(workDir);
    const subFiles = files.filter((f) => /\.(json3|srv3|vtt)$/.test(f));
    if (!subFiles.length) throw new Error('NO_CAPTIONS');

    subFiles.sort((a, b) => {
      const score = (f: string) => {
        let s = 0;
        if (/\.en\./.test(f) || /\.en-/.test(f)) s += 100;
        if (/\.hi\./.test(f) || /\.hi-/.test(f)) s += 50;
        if (f.endsWith('.json3')) s += 10;
        if (f.endsWith('.srv3')) s += 5;
        if (/auto/i.test(f)) s -= 1;
        return s;
      };
      return score(b) - score(a);
    });

    const pick = subFiles[0];
    const body = await readFile(join(workDir, pick), 'utf8');

    let lines: TranscriptLine[] = [];
    if (pick.endsWith('.json3')) {
      lines = parseJSON3(JSON.parse(body));
    } else if (pick.endsWith('.srv3')) {
      lines = parseXML(body);
    } else if (pick.endsWith('.vtt')) {
      lines = parseVTT(body);
    }

    return { lines, title };
  } finally {
    rm(workDir, { recursive: true, force: true }).catch(() => { /* ignore */ });
  }
}

function parseVTT(vtt: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  const blocks = vtt.split(/\r?\n\r?\n/);
  const tsRe = /(\d+):(\d+):(\d+)\.(\d+)\s+-->\s+(\d+):(\d+):(\d+)\.(\d+)/;
  const toSec = (h: string, m: string, s: string, ms: string) =>
    parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000;
  for (const block of blocks) {
    const m = block.match(tsRe);
    if (!m) continue;
    const start = toSec(m[1], m[2], m[3], m[4]);
    const end = toSec(m[5], m[6], m[7], m[8]);
    const textLines = block.split(/\r?\n/).slice(1).filter((l) => !tsRe.test(l));
    const text = decodeEntities(
      textLines.join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    ).trim();
    if (text) lines.push({ start, dur: end - start, text });
  }
  return lines;
}

// ── Method 2: InnerTube API (ANDROID client — most reliable for captions) ──

const ANDROID_VERSION = '20.10.38';
const ANDROID_UA = `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`;

async function fetchViaInnerTube(
  videoId: string
): Promise<{ lines: TranscriptLine[]; title: string }> {
  const apiUrl = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': ANDROID_UA,
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: ANDROID_VERSION,
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

  console.log(`[transcript] InnerTube ANDROID: ${tracks.length} tracks for ${videoId}, status=${data?.playabilityStatus?.status}`);

  if (!tracks.length) throw new Error('NO_CAPTIONS');

  const track = pickTrack(tracks);
  if (!track) throw new Error('NO_CAPTIONS');
  console.log(`[transcript] Fetching captions: lang=${track.languageCode}, url=${track.baseUrl.substring(0, 80)}`);

  // Fetch captions — try XML first (more reliable), then JSON3
  let lines: TranscriptLine[] = [];
  for (const ua of [ANDROID_UA, USER_AGENT]) {
    for (const fmt of ['', 'json3'] as const) {
      try {
        const captionUrl = fmt
          ? `${track.baseUrl}&fmt=${fmt}`
          : track.baseUrl;
        const capResp = await fetch(captionUrl, {
          headers: { 'User-Agent': ua },
          signal: AbortSignal.timeout(10000),
        });
        if (!capResp.ok) continue;
        const body = await capResp.text();
        if (!body || body.length < 10) continue;
        lines = fmt === 'json3' ? parseJSON3(JSON.parse(body)) : parseXML(body);
        if (lines.length) break;
      } catch {
        continue;
      }
    }
    if (lines.length) break;
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

  // Method 1: Apify (reliable, paid-per-use)
  try {
    const result = await fetchViaApify(videoId);
    lines = result.lines;
    title = result.title;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    errors.push(`Apify: ${msg}`);
    console.log(`[transcript] Apify failed for ${videoId}: ${msg}`);
  }

  // Method 2: yt-dlp with cookies (free fallback)
  if (!lines.length) {
    try {
      const result = await fetchViaYtDlp(videoId);
      lines = result.lines;
      title = result.title;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`yt-dlp: ${msg}`);
      console.log(`[transcript] yt-dlp failed for ${videoId}: ${msg}`);
    }
  }

  // Method 3: InnerTube ANDROID API (fallback)
  if (!lines.length) {
    try {
      const result = await fetchViaInnerTube(videoId);
      lines = result.lines;
      title = result.title;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`InnerTube: ${msg}`);
      console.log(`[transcript] InnerTube failed for ${videoId}: ${msg}`);
    }
  }

  // Method 3: Watch page HTML parse (last resort)
  if (!lines.length) {
    try {
      const result = await fetchViaWatchPage(videoId);
      lines = result.lines;
      title = result.title || title;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      errors.push(`WatchPage: ${msg}`);
      console.log(`[transcript] Watch page failed for ${videoId}: ${msg}`);
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
    } else if (errorDetail.includes('COOKIES_EXPIRED')) {
      userMessage = 'YouTube session expired. Cookies need to be refreshed on the server.';
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

// ── Summarize transcript via OpenRouter ──────────────────────────────

router.post('/summarize', async (req, res) => {
  const { transcript, title, style, customPrompt } = req.body as {
    transcript?: string; title?: string; style?: string; customPrompt?: string;
  };

  if (!transcript || transcript.length < 20) {
    return res.status(400).json({ ok: false, error: 'Transcript text is required' });
  }

  if (!config.openrouterApiKey) {
    return res.status(500).json({ ok: false, error: 'Summarization service not configured' });
  }

  // Truncate very long transcripts to ~12000 words to stay within context limits
  const words = transcript.split(/\s+/);
  const truncated = words.length > 12000 ? words.slice(0, 12000).join(' ') + '\n\n[Transcript truncated...]' : transcript;

  const SYSTEM_PROMPTS: Record<string, string> = {
    default: `You are an expert content summarizer. Extract the SUBSTANCE from a YouTube video transcript.

RULES:
- Focus ONLY on the actual ideas, arguments, facts, insights, and conclusions. This is what matters.
- SKIP all filler: greetings, intros, "hey guys", pleasantries, self-promotion, subscribe reminders, sponsor segments, small talk, transitions like "so let's move on", audience interaction.
- SKIP descriptions of what the speaker is doing ("the speaker greets", "he sits down", "she thanks the audience"). Nobody cares. Just give the IDEAS.
- Structure with markdown headers (##) by topic, NOT by chronology. Group related ideas together.
- Use bullet points for concrete facts, steps, or examples.
- Include specific data, numbers, names, frameworks, or resources mentioned — these are the valuable parts.
- Keep it tight. Every sentence should carry information. If a sentence could be removed without losing substance, remove it.
- Aim for 300-600 words depending on video length. Not a tweet, not an essay.
- End with "## Key Takeaways" — 3-5 bullet points of the most actionable/important insights.
- Write directly. No "The speaker discusses..." — just state what was said as fact.`,

    ppt: `You are an expert at turning video content into a presentation deck.

Output a slide-deck outline in clean markdown that can be copy-pasted directly into PowerPoint or Google Slides.

FORMAT (strict):
- Slide 1 is the title slide: "# <Title>" then a one-line subtitle.
- Each subsequent slide starts with "## Slide N: <Slide Title>" (a punchy 3-7 word title).
- Under each slide title, give 3-6 bullet points (use "-"). Each bullet 6-14 words. Concrete and specific.
- Optionally include "**Speaker note:**" line below the bullets with 1-2 sentences of context the presenter would say aloud.
- Aim for 6-12 slides total depending on content depth.
- Last slide is "## Slide N: Key Takeaways" — 3-5 bullets of the most important points.

RULES:
- Skip filler, intros, sponsor segments, audience interaction.
- Use specific data, numbers, names, frameworks mentioned in the video.
- Bullets are statements, not full sentences. Active voice. No fluff.
- Group related ideas — don't follow video chronology blindly.`,
  };

  let systemPrompt: string;
  if (style === 'custom' && customPrompt && customPrompt.trim().length > 5) {
    systemPrompt = customPrompt.trim() + '\n\nOutput in clean markdown.';
  } else if (style === 'ppt') {
    systemPrompt = SYSTEM_PROMPTS.ppt;
  } else {
    systemPrompt = SYSTEM_PROMPTS.default;
  }

  const userPrompt = title
    ? `Summarize this YouTube video transcript.\n\nVideo Title: "${title}"\n\nTranscript:\n${truncated}`
    : `Summarize this YouTube video transcript.\n\nTranscript:\n${truncated}`;

  // Models to try in order: free first, then paid fallback
  const MODELS = [
    { id: 'openai/gpt-oss-120b:free', label: 'OpenAI GPT-OSS 120B (Free)' },
    { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  ];

  try {
    // Stream the response for better UX
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let response: Response | null = null;
    let usedModel = MODELS[0];

    for (const model of MODELS) {
      console.log(`[summarize] Trying model: ${model.id}`);
      const attempt = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openrouterApiKey}`,
          'HTTP-Referer': 'https://web.deepakchandwani.com',
          'X-Title': 'Deepak Chandwani - Transcript Summarizer',
        },
        body: JSON.stringify({
          model: model.id,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (attempt.ok) {
        response = attempt;
        usedModel = model;
        console.log(`[summarize] Using model: ${model.label}`);
        // Tell client which model is being used
        res.write(`data: ${JSON.stringify({ model: model.label })}\n\n`);
        break;
      } else {
        const err = await attempt.text();
        console.log(`[summarize] ${model.id} failed (${attempt.status}): ${err.substring(0, 200)}`);
      }
    }

    if (!response) {
      res.write(`data: ${JSON.stringify({ error: 'All models failed. Please try again later.' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null;

    // Gemini 2.0 Flash pricing via OpenRouter (per token)
    const INPUT_COST_PER_TOKEN = 0.10 / 1_000_000;   // $0.10 per 1M input tokens
    const OUTPUT_COST_PER_TOKEN = 0.40 / 1_000_000;   // $0.40 per 1M output tokens

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
          // OpenRouter includes usage in the final chunk
          if (parsed.usage) {
            usage = parsed.usage;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    // Send usage/cost info as the final event
    console.log('[summarize] Usage captured:', usage ? 'yes' : 'no', JSON.stringify(usage)?.substring(0, 200));
    if (usage) {
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
      // Free models: show $0. Otherwise use OpenRouter's reported cost.
      const isFreeModel = usedModel.id.includes(':free');
      const costUsd = isFreeModel ? 0 : (
        (usage as Record<string, unknown>).cost
          ? Number((usage as Record<string, unknown>).cost)
          : (inputTokens * INPUT_COST_PER_TOKEN) + (outputTokens * OUTPUT_COST_PER_TOKEN)
      );

      res.write(`data: ${JSON.stringify({
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          cost_usd: costUsd,
          model: usedModel.label,
        }
      })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[summarize] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Summarization failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

// ── POST /prompt-creator — expand a rough idea into a detailed system prompt ──

router.post('/prompt-creator', async (req, res) => {
  const { idea } = req.body as { idea?: string };
  if (!idea || idea.trim().length < 3) {
    return res.status(400).json({ ok: false, error: 'Tell us what kind of summary you want.' });
  }
  if (!config.openrouterApiKey) {
    return res.status(500).json({ ok: false, error: 'Prompt creator service not configured' });
  }

  const systemPrompt = `You write SYSTEM PROMPTS for a downstream LLM that will receive a YouTube video transcript and produce a final deliverable for the user.

CRITICAL: The prompt you output will be sent verbatim as the system message to that downstream LLM, paired with the transcript as the user message. The downstream LLM must produce the ACTUAL final deliverable (slides, summary, notes, table, workflow, etc.) — NOT another prompt, NOT instructions for someone else, NOT a template.

Therefore:
- Write the prompt as a DIRECT instruction to the downstream LLM ("You are a teacher. Read the transcript and produce..." NOT "Generate a prompt that...").
- Never ask the downstream LLM to "output a prompt", "create a prompt", "produce instructions" or anything meta. It must produce the deliverable itself.
- Specify role, exact output format (slides, numbered list, table, markdown headings…), length, audience/tone, and what to skip (filler, sponsor segments).
- Be 80-200 words. Self-contained.

OUTPUT: only the prompt text — no preamble, no explanation, no markdown code fences, no "Here is the prompt:" header.

EXAMPLE (good output):
You are an expert workflow analyst. Read the transcript of a technical talk and extract the complete step-by-step workflow it describes. Present it as a numbered list where each step is one concise sentence stating the purpose and key tools involved, followed by indented bullets for sub-tasks. After the numbered list, add an "## Overall Goal" section with 3-4 bullet points describing the high-level objective. Use precise technical language for senior engineers. Skip filler, sponsor segments and audience interaction. Do not cap the workflow length.`;

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openrouterApiKey}`,
        'HTTP-Referer': 'https://web.deepakchandwani.com',
        'X-Title': 'Deepak Chandwani - Prompt Creator',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: idea.trim().slice(0, 2000) },
        ],
        max_tokens: 600,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!r.ok) {
      const err = await r.text();
      console.log(`[prompt-creator] OpenRouter ${r.status}: ${err.substring(0, 200)}`);
      return res.status(502).json({ ok: false, error: 'Prompt generation failed' });
    }
    const data = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
    const prompt = data.choices?.[0]?.message?.content?.trim() || '';
    if (!prompt) return res.status(502).json({ ok: false, error: 'Empty response' });
    res.json({ ok: true, prompt });
  } catch (err) {
    console.error('[prompt-creator] error:', err);
    res.status(500).json({ ok: false, error: 'Prompt generation failed' });
  }
});

// ── POST /stt-quick — short-clip speech-to-text via Sarvam (no auth) ──

router.post('/stt-quick', audioUpload.single('audio'), async (req, res) => {
  const audio = req.file;
  const languageCode = (req.body?.languageCode as string) || 'unknown';

  if (!audio || audio.buffer.length < 500) {
    return res.status(400).json({ ok: false, error: 'Audio is required' });
  }
  if (!config.sarvamApiKey) {
    return res.status(503).json({ ok: false, error: 'STT not configured' });
  }

  try {
    const form = new FormData();
    const baseMime = (audio.mimetype || 'audio/webm').split(';')[0].trim();
    const blob = new Blob([new Uint8Array(audio.buffer)], { type: baseMime });
    const ext =
      baseMime.includes('webm') ? 'webm' :
      baseMime.includes('mp4') ? 'm4a' :
      baseMime.includes('wav') ? 'wav' :
      baseMime.includes('ogg') ? 'ogg' : 'webm';
    form.append('file', blob, `clip.${ext}`);
    form.append('model', 'saarika:v2.5');
    form.append('language_code', languageCode);
    form.append('with_timestamps', 'false');

    const r = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': config.sarvamApiKey },
      body: form,
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) {
      const err = await r.text();
      console.log(`[stt-quick] Sarvam ${r.status}: ${err.substring(0, 300)}`);
      return res.status(502).json({ ok: false, error: `STT failed (${r.status})` });
    }
    const data = await r.json() as { transcript?: string; language_code?: string };
    res.json({ ok: true, transcript: data.transcript || '', languageCode: data.language_code || languageCode });
  } catch (err) {
    console.error('[stt-quick] error:', err);
    res.status(500).json({ ok: false, error: 'STT failed' });
  }
});

export default router;
