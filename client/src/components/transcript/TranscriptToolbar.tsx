import type { TranscriptLine } from "@/types";
import { formatTime } from "@/lib/vtt-parser";

interface TranscriptToolbarProps {
  lines: TranscriptLine[];
  title: string;
  lineCount: number;
  showTimestamps: boolean;
  onToggleTimestamps: () => void;
  view: "lines" | "full";
  onChangeView: (view: "lines" | "full") => void;
  onSummarize: () => void;
  isSummarizing: boolean;
}

export default function TranscriptToolbar({
  lines,
  title,
  lineCount,
  showTimestamps,
  onToggleTimestamps,
  view,
  onChangeView,
  onSummarize,
  isSummarizing,
}: TranscriptToolbarProps) {
  function copyAll() {
    const text = lines
      .map((l) => `[${formatTime(l.start)}]  ${l.text}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  }

  function downloadTxt() {
    const header = `Transcript: ${title}\nExtracted via deepakchandwani.com\n${"─".repeat(60)}\n\n`;
    const body = lines
      .map((l) => `[${formatTime(l.start)}]  ${l.text}`)
      .join("\n");
    const blob = new Blob([header + body], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download =
      title
        .replace(/[^a-z0-9]/gi, "_")
        .substring(0, 50) + "_transcript.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-space text-base font-bold text-ink">
            Transcript
          </span>
          <span className="rounded-full bg-gradient-to-br from-indigo/10 to-indigo/20 px-3 py-0.5 text-xs font-bold text-indigo">
            {lineCount} lines
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleTimestamps}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              showTimestamps
                ? "border border-amber/40 bg-gradient-to-br from-amber/10 to-amber/20 text-amber"
                : "border border-light-3 bg-light text-muted"
            }`}
          >
            {"\ud83d\udd52"} Timestamps
          </button>
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo/10 to-indigo/20 px-3 py-2 text-xs font-bold text-indigo transition-all hover:bg-indigo hover:text-white"
          >
            {"\ud83d\udccb"} Copy All
          </button>
          <button
            onClick={downloadTxt}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-green/10 to-green/20 px-3 py-2 text-xs font-bold text-green transition-all hover:bg-green hover:text-white"
          >
            {"\u2b07"} Download
          </button>
          <button
            onClick={onSummarize}
            disabled={isSummarizing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-cyan-2 to-indigo px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
          >
            {isSummarizing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Summarizing...
              </>
            ) : (
              <>
                {"\u2728"} Summarize
              </>
            )}
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => onChangeView("lines")}
          className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
            view === "lines"
              ? "border-transparent bg-gradient-to-r from-indigo to-cyan-2 text-white shadow-md"
              : "border-light-3 bg-white text-muted"
          }`}
        >
          {"\u2630"} Line by Line
        </button>
        <button
          onClick={() => onChangeView("full")}
          className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
            view === "full"
              ? "border-transparent bg-gradient-to-r from-indigo to-cyan-2 text-white shadow-md"
              : "border-light-3 bg-white text-muted"
          }`}
        >
          {"\ud83d\udcc4"} Full Text
        </button>
      </div>
    </div>
  );
}
