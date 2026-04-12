import type { TranscriptLine } from "@/types";

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export { formatTime };

/**
 * Parse YouTube's JSON3 caption format into TranscriptLine[].
 */
export function parseJSON3(data: {
  events?: Array<{
    tStartMs: number;
    dDurationMs?: number;
    segs?: Array<{ utf8?: string }>;
  }>;
}): TranscriptLine[] {
  if (!data.events) return [];
  return data.events
    .filter((ev) => ev.segs)
    .map((ev) => ({
      start: ev.tStartMs / 1000,
      dur: (ev.dDurationMs || 0) / 1000,
      text: (ev.segs || [])
        .map((s) => s.utf8 || "")
        .join("")
        .replace(/\n/g, " ")
        .trim(),
    }))
    .filter((l) => l.text && l.text !== "\n");
}

/**
 * Parse WebVTT format into TranscriptLine[].
 */
export function parseVTT(text: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];

  for (const block of text.split(/\n\n+/)) {
    if (!block.trim() || /^WEBVTT|^NOTE/.test(block)) continue;

    const parts = block.split("\n");
    let tsLine: string | null = null;
    const texts: string[] = [];

    for (const p of parts) {
      if (p.includes("-->")) {
        tsLine = p;
      } else if (tsLine && p.trim() && !/^\d+$/.test(p.trim())) {
        texts.push(p);
      }
    }

    if (!tsLine || !texts.length) continue;

    const m =
      tsLine.match(/(\d+):(\d+):(\d+)/) || tsLine.match(/(\d+):(\d+)\./);
    if (!m) continue;

    const secs =
      m[0].split(":").length >= 3
        ? +m[1] * 3600 + +m[2] * 60 + +m[3]
        : +m[1] * 60 + +m[2];

    // Parse end time for duration
    const endMatch = tsLine
      .split("-->")[1]
      ?.match(/(\d+):(\d+):(\d+)/) ||
      tsLine.split("-->")[1]?.match(/(\d+):(\d+)\./);
    const endSecs = endMatch
      ? endMatch[0].split(":").length >= 3
        ? +endMatch[1] * 3600 + +endMatch[2] * 60 + +endMatch[3]
        : +endMatch[1] * 60 + +endMatch[2]
      : secs;

    const lineText = texts
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();

    if (lineText) {
      lines.push({ start: secs, dur: endSecs - secs, text: lineText });
    }
  }

  return lines;
}
