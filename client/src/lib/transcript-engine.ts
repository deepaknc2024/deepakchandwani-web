import type { TranscriptLine } from "@/types";
import { proxyFetch, CORS_PROXIES } from "./cors-proxy";
import { parseJSON3, parseVTT } from "./vtt-parser";

// ── Invidious instances (open-source YT frontends, CORS-enabled API) ──
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.io.lol",
  "https://invidious.privacydev.net",
  "https://yt.artemislena.eu",
  "https://invidious.fdn.fr",
  "https://iv.datura.network",
];

// ── Helpers ───────────────────────────────────────────────────────────

export function extractVideoId(url: string): string | null {
  url = url.trim();
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
  return null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack {
  return (
    tracks.find((t) => t.languageCode === "en" && !t.kind) ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode?.startsWith("en")) ||
    tracks[0]
  );
}

// ── Fetch caption lines from a track URL ──────────────────────────────

async function fetchLines(baseUrl: string): Promise<TranscriptLine[]> {
  // Try direct fetch first (works when YouTube sets CORS headers)
  for (const fmt of ["json3", "vtt"] as const) {
    try {
      const r = await fetch(`${baseUrl}&fmt=${fmt}`, {
        credentials: "include",
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) continue;
      const lines =
        fmt === "json3"
          ? parseJSON3(await r.json())
          : parseVTT(await r.text());
      if (lines.length) return lines;
    } catch {
      // CORS or network error, try proxy
    }
  }

  // Fallback: CORS proxy
  try {
    const r = await proxyFetch(`${baseUrl}&fmt=json3`);
    const j = await r.json();
    const lines = parseJSON3(j);
    if (lines.length) return lines;
  } catch {
    // fall through
  }

  const r = await proxyFetch(`${baseUrl}&fmt=vtt`);
  return parseVTT(await r.text());
}

// ── Method 1: Invidious API ───────────────────────────────────────────

export async function fetchViaInvidious(
  videoId: string
): Promise<{ lines: TranscriptLine[]; title: string } | null> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const r = await fetch(
        `${base}/api/v1/videos/${videoId}?fields=title,captions`,
        { signal: AbortSignal.timeout(9000) }
      );
      if (!r.ok) continue;
      const data = await r.json();
      if (data.error) continue;

      const title = data.title || "";
      const captions = data.captions || [];
      if (!captions.length) continue;

      const cap =
        captions.find(
          (c: { languageCode: string; label: string }) =>
            c.languageCode === "en" && /auto/i.test(c.label)
        ) ||
        captions.find(
          (c: { languageCode: string }) => c.languageCode === "en"
        ) ||
        captions.find((c: { languageCode: string }) =>
          c.languageCode?.startsWith("en")
        ) ||
        captions[0];
      if (!cap) continue;

      const tr = await fetch(`${base}${cap.url}`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!tr.ok) continue;
      const text = await tr.text();
      const lines = parseVTT(text);
      if (lines.length > 0) return { lines, title };
    } catch {
      // try next instance
    }
  }
  return null;
}

// ── Method 2: InnerTube API ───────────────────────────────────────────

export async function fetchViaInnerTube(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; title: string } | null> {
  const apiUrl =
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
  const payload = JSON.stringify({
    videoId,
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240101.00.00",
        hl: "en",
        gl: "US",
      },
    },
  });

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const resp = await fetch(CORS_PROXIES[i](apiUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: payload,
        signal: AbortSignal.timeout(12000),
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const tracks =
        data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const title = data?.videoDetails?.title || "";
      if (tracks.length) return { tracks, title };
    } catch {
      // try next proxy
    }
  }
  return null;
}

// ── Method 3: HTML page parse ─────────────────────────────────────────

export async function fetchViaHtmlParse(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; title: string }> {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
  const resp = await proxyFetch(ytUrl);
  const html = await resp.text();

  // Title
  const titleM =
    html.match(/<title>([^<]+?)\s*[-\u2013|]\s*YouTube<\/title>/i) ||
    html.match(/"title":"([^"]+)","lengthSeconds"/);
  let title = "Untitled Video";
  if (titleM) {
    try {
      title = JSON.parse('"' + titleM[1].replace(/"/g, '\\"') + '"');
    } catch {
      title = titleM[1];
    }
  }

  // Extract caption track base URLs
  const trackPattern = /"baseUrl"\s*:\s*"(https:[^"]*timedtext[^"]+)"/g;
  const baseUrls = [...html.matchAll(trackPattern)]
    .map((m) => {
      try {
        return JSON.parse('"' + m[1] + '"');
      } catch {
        return null;
      }
    })
    .filter(Boolean) as string[];

  if (!baseUrls.length) {
    if (html.includes('"reason"') && html.includes("Sign in")) {
      throw new Error(
        "This video requires sign-in to access. Try a public video."
      );
    }
    if (!html.includes('"captionTracks"')) {
      throw new Error(
        "No captions available for this video. Auto-captions may be disabled by the creator."
      );
    }
    throw new Error("Could not extract caption URLs. Please try again.");
  }

  const langCodes = [
    ...html.matchAll(/"languageCode"\s*:\s*"([^"]+)"/g),
  ].map((m) => m[1]);

  const tracks: CaptionTrack[] = baseUrls.map((url, i) => ({
    baseUrl: url,
    languageCode: langCodes[i] || "en",
  }));

  return { tracks, title };
}

// ── Main: try all 3 methods in sequence ───────────────────────────────

export async function fetchTranscript(
  url: string
): Promise<{ lines: TranscriptLine[]; title: string }> {
  const videoId = extractVideoId(url);
  if (!videoId)
    throw new Error("Invalid YouTube URL. Please paste a valid YouTube link.");

  let lines: TranscriptLine[] = [];
  let title = "Untitled Video";

  // Method 1: Invidious
  try {
    const result = await fetchViaInvidious(videoId);
    if (result && result.lines.length) {
      lines = result.lines;
      title = result.title || title;
    }
  } catch {
    // fall through
  }

  // Method 2: InnerTube
  if (!lines.length) {
    try {
      const result = await fetchViaInnerTube(videoId);
      if (result && result.tracks.length) {
        title = result.title || title;
        const track = pickTrack(result.tracks);
        lines = await fetchLines(track.baseUrl);
      }
    } catch {
      // fall through
    }
  }

  // Method 3: HTML parse
  if (!lines.length) {
    const result = await fetchViaHtmlParse(videoId);
    title = result.title || title;
    const track = pickTrack(result.tracks);
    lines = await fetchLines(track.baseUrl);
  }

  if (!lines.length) {
    throw new Error(
      "No captions found for this video. Subtitles may not be available."
    );
  }

  // Remove duplicate consecutive lines (auto-caption artifact)
  lines = lines.filter(
    (l, i) => i === 0 || l.text.toLowerCase() !== lines[i - 1].text.toLowerCase()
  );

  return { lines, title };
}
