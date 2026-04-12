import { useState, useCallback, useMemo } from "react";
import type { TranscriptLine } from "@/types";
import { fetchTranscript } from "@/lib/transcript-engine";

type Status = "idle" | "loading" | "success" | "error";

interface TranscriptState {
  status: Status;
  lines: TranscriptLine[];
  title: string;
  wordCount: number;
  readTime: number;
  error: string | null;
  fetch: (url: string) => Promise<void>;
  clear: () => void;
}

export function useTranscript(): TranscriptState {
  const [status, setStatus] = useState<Status>("idle");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(
    () =>
      lines.reduce(
        (n, l) => n + l.text.split(/\s+/).filter(Boolean).length,
        0
      ),
    [lines]
  );

  const readTime = useMemo(() => Math.ceil(wordCount / 200), [wordCount]);

  const fetchUrl = useCallback(async (url: string) => {
    setStatus("loading");
    setError(null);
    setLines([]);
    setTitle("");
    try {
      const result = await fetchTranscript(url);
      setLines(result.lines);
      setTitle(result.title);
      setStatus("success");
    } catch (e) {
      let msg =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      if (msg === "PROXY_FAIL" || msg.includes("proxy")) {
        msg =
          "Network error: Could not reach YouTube. Please check your internet connection and try again.";
      }
      setError(msg);
      setStatus("error");
    }
  }, []);

  const clear = useCallback(() => {
    setStatus("idle");
    setLines([]);
    setTitle("");
    setError(null);
  }, []);

  return {
    status,
    lines,
    title,
    wordCount,
    readTime,
    error,
    fetch: fetchUrl,
    clear,
  };
}
