import { Router } from 'express';
import { config } from '../config.js';

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

  // Method 1: InnerTube ANDROID API (most reliable)
  try {
    const result = await fetchViaInnerTube(videoId);
    lines = result.lines;
    title = result.title;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    errors.push(`InnerTube: ${msg}`);
    console.log(`[transcript] InnerTube failed for ${videoId}: ${msg}`);
  }

  // Method 2: Watch page HTML parse (fallback)
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
  const { transcript, title } = req.body as { transcript?: string; title?: string };

  if (!transcript || transcript.length < 20) {
    return res.status(400).json({ ok: false, error: 'Transcript text is required' });
  }

  if (!config.openrouterApiKey) {
    return res.status(500).json({ ok: false, error: 'Summarization service not configured' });
  }

  // Truncate very long transcripts to ~12000 words to stay within context limits
  const words = transcript.split(/\s+/);
  const truncated = words.length > 12000 ? words.slice(0, 12000).join(' ') + '\n\n[Transcript truncated...]' : transcript;

  const systemPrompt = `You are an expert content summarizer. Extract the SUBSTANCE from a YouTube video transcript.

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
- Write directly. No "The speaker discusses..." — just state what was said as fact.`;

  const userPrompt = title
    ? `Summarize this YouTube video transcript in detail.\n\nVideo Title: "${title}"\n\nTranscript:\n${truncated}`
    : `Summarize this YouTube video transcript in detail.\n\nTranscript:\n${truncated}`;

  try {
    // Stream the response for better UX
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'HTTP-Referer': 'https://web.deepakchandwani.com',
        'X-Title': 'Deepak Chandwani - Transcript Summarizer',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[summarize] OpenRouter error:', response.status, err);
      res.write(`data: ${JSON.stringify({ error: 'Summarization failed. Please try again.' })}\n\n`);
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
    if (usage) {
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
      const costUsd = (inputTokens * INPUT_COST_PER_TOKEN) + (outputTokens * OUTPUT_COST_PER_TOKEN);

      res.write(`data: ${JSON.stringify({
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          cost_usd: costUsd,
          model: 'google/gemini-2.0-flash-001',
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

export default router;
