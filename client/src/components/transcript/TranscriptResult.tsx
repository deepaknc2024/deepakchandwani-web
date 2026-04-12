import { useMemo } from "react";
import type { TranscriptLine } from "@/types";
import { formatTime } from "@/lib/vtt-parser";

interface TranscriptResultProps {
  lines: TranscriptLine[];
  title: string;
  wordCount: number;
  readTime: number;
  videoId: string | null;
  showTimestamps: boolean;
  view: "lines" | "full";
  searchQuery: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function TranscriptResult({
  lines,
  title,
  wordCount,
  readTime,
  videoId,
  showTimestamps,
  view,
  searchQuery,
}: TranscriptResultProps) {
  const filteredLines = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return lines;
    return lines.filter((l) => l.text.toLowerCase().includes(term));
  }, [lines, searchQuery]);

  function highlightText(text: string): string {
    const term = searchQuery.trim();
    if (!term) return escapeHtml(text);
    const re = new RegExp(escapeRegex(term), "gi");
    return escapeHtml(text).replace(
      re,
      (m) => `<mark class="rounded bg-amber/40 px-0.5">${m}</mark>`,
    );
  }

  const fullTextParagraphs = useMemo(() => {
    const chunks: string[] = [];
    for (let i = 0; i < filteredLines.length; i += 20) {
      chunks.push(
        filteredLines
          .slice(i, i + 20)
          .map((l) => l.text)
          .join(" "),
      );
    }
    return chunks;
  }, [filteredLines]);

  return (
    <div className="space-y-4">
      {/* Video meta card */}
      <div className="flex items-center gap-5 rounded-2xl border border-indigo/6 bg-white p-5 shadow-lg max-sm:flex-col">
        <div className="flex-shrink-0">
          {videoId && (
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt="Thumbnail"
              className="w-40 rounded-xl object-cover max-sm:w-full"
              style={{ aspectRatio: "16/9" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="mb-1 font-space text-lg font-bold leading-snug text-ink">
            {title}
          </h2>
          {videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-indigo hover:underline"
            >
              {"\ud83d\udd17"} Watch on YouTube
            </a>
          )}
          <div className="mt-3 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm font-medium text-body">
              <span className="h-2 w-2 rounded-full bg-indigo" />
              {lines.length} segments
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-body">
              <span className="h-2 w-2 rounded-full bg-cyan-2" />
              {wordCount.toLocaleString()} words
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-body">
              <span className="h-2 w-2 rounded-full bg-green" />~{readTime} min
              read
            </div>
          </div>
        </div>
      </div>

      {/* Transcript content */}
      {view === "lines" ? (
        <div className="overflow-hidden rounded-2xl border border-indigo/7 bg-white shadow-lg">
          <div className="max-h-[65vh] overflow-y-auto p-2">
            {filteredLines.map((line, i) => (
              <div key={i}>
                <div
                  className={`flex items-start gap-4 rounded-xl px-4 py-3 transition-colors ${
                    searchQuery.trim() &&
                    line.text
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase())
                      ? "bg-amber/10"
                      : "hover:bg-light"
                  }`}
                >
                  {showTimestamps && (
                    <span className="mt-0.5 flex-shrink-0 whitespace-nowrap rounded-md bg-indigo/8 px-2 py-0.5 font-mono text-xs font-medium tracking-wide text-indigo">
                      {formatTime(line.start)}
                    </span>
                  )}
                  <span
                    className="text-sm leading-relaxed text-ink"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(line.text),
                    }}
                  />
                </div>
                {(i + 1) % 10 === 0 && i < filteredLines.length - 1 && (
                  <div className="mx-4 my-1 h-px bg-indigo/5" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-indigo/7 bg-white p-6 shadow-lg">
          {fullTextParagraphs.map((chunk, i) => (
            <p
              key={i}
              className="mb-4 text-sm leading-relaxed text-body last:mb-0"
              dangerouslySetInnerHTML={{ __html: highlightText(chunk) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
