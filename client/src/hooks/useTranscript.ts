import { useState, useCallback, useMemo } from "react";
import type { TranscriptLine } from "@/types";

type Status = "idle" | "loading" | "success" | "error";

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
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

export function useTranscript() {
  const [status, setStatus] = useState<Status>("idle");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const wordCount = useMemo(
    () => lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0),
    [lines],
  );

  const readTime = useMemo(() => Math.ceil(wordCount / 200), [wordCount]);

  const fetchUrl = useCallback(async (url: string) => {
    setStatus("loading");
    setError(null);
    setLines([]);
    setTitle("");

    const vid = extractVideoId(url);
    setVideoId(vid);

    try {
      const resp = await fetch(`/api/transcript?url=${encodeURIComponent(url)}`);
      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }

      setLines(data.lines);
      setTitle(data.title);
      setVideoId(data.videoId);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
      setStatus("error");
    }
  }, []);

  const clear = useCallback(() => {
    setStatus("idle");
    setLines([]);
    setTitle("");
    setError(null);
    setVideoId(null);
  }, []);

  return { status, lines, title, wordCount, readTime, error, videoId, fetch: fetchUrl, clear };
}
