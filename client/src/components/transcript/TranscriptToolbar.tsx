import { useState } from "react";
import type { TranscriptLine } from "@/types";
import { formatTime } from "@/lib/vtt-parser";
import { useLanguage } from "@/contexts/LanguageContext";

export type SummaryStyle = "default" | "ppt" | "custom";

interface TranscriptToolbarProps {
  lines: TranscriptLine[];
  title: string;
  lineCount: number;
  showTimestamps: boolean;
  onToggleTimestamps: () => void;
  view: "lines" | "full";
  onChangeView: (view: "lines" | "full") => void;
  onSummarize: (opts: { style: SummaryStyle; customPrompt?: string }) => void;
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
  const { t } = useLanguage();
  const [style, setStyle] = useState<SummaryStyle>("default");
  const [customPrompt, setCustomPrompt] = useState("");

  function runSummary() {
    onSummarize({ style, customPrompt: style === "custom" ? customPrompt : undefined });
  }

  function copyAll() {
    const text = lines.map((l) => `[${formatTime(l.start)}]  ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
  }

  function downloadTxt() {
    const header = `Transcript: ${title}\nExtracted via deepakchandwani.com\n${"─".repeat(60)}\n\n`;
    const body = lines.map((l) => `[${formatTime(l.start)}]  ${l.text}`).join("\n");
    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[^a-z0-9]/gi, "_").substring(0, 50) + "_transcript.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-space text-base font-bold text-ink">{t.transcript.transcriptLabel}</span>
          <span className="rounded-full bg-gradient-to-br from-indigo/10 to-indigo/20 px-3 py-0.5 text-xs font-bold text-indigo">
            {lineCount} {t.transcript.lines}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleTimestamps}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              showTimestamps ? "border border-amber/40 bg-gradient-to-br from-amber/10 to-amber/20 text-amber" : "border border-light-3 bg-light text-muted"
            }`}
          >
            {"\ud83d\udd52"} {t.transcript.timestamps}
          </button>
          <button onClick={copyAll} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo/10 to-indigo/20 px-3 py-2 text-xs font-bold text-indigo transition-all hover:bg-indigo hover:text-white">
            {"\ud83d\udccb"} {t.transcript.copyAll}
          </button>
          <button onClick={downloadTxt} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-green/10 to-green/20 px-3 py-2 text-xs font-bold text-green transition-all hover:bg-green hover:text-white">
            {"\u2b07"} {t.transcript.download}
          </button>
          <button
            onClick={runSummary}
            disabled={isSummarizing || (style === "custom" && customPrompt.trim().length < 5)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-cyan-2 to-indigo px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
          >
            {isSummarizing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t.transcript.summarizing}
              </>
            ) : (
              <>{"\u2728"} {t.transcript.summarize}</>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-2/20 bg-gradient-to-br from-cyan-2/5 to-indigo/5 p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-muted">Summary style:</span>
          {([
            { id: "default", label: "\ud83d\udcc4 Default", hint: "Concise topic-grouped summary" },
            { id: "ppt", label: "\ud83d\udcca PPT / Slides", hint: "Slide-deck outline ready to paste" },
            { id: "custom", label: "\u270f\ufe0f Custom", hint: "Write your own instructions" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStyle(opt.id)}
              title={opt.hint}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                style === opt.id
                  ? "bg-gradient-to-br from-indigo to-cyan-2 text-white shadow-sm"
                  : "border border-light-3 bg-white text-muted hover:border-indigo/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {style === "custom" && (
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Summarize as 5 study notes for a 10-year-old in simple language\u2026"
            rows={3}
            className="mt-2 w-full resize-y rounded-lg border border-light-3 bg-white px-3 py-2 text-xs text-ink placeholder:text-muted/60 focus:border-indigo focus:outline-none"
          />
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onChangeView("lines")}
          className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
            view === "lines" ? "border-transparent bg-gradient-to-r from-indigo to-cyan-2 text-white shadow-md" : "border-light-3 bg-white text-muted"
          }`}
        >
          {"\u2630"} {t.transcript.lineByLine}
        </button>
        <button
          onClick={() => onChangeView("full")}
          className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
            view === "full" ? "border-transparent bg-gradient-to-r from-indigo to-cyan-2 text-white shadow-md" : "border-light-3 bg-white text-muted"
          }`}
        >
          {"\ud83d\udcc4"} {t.transcript.fullText}
        </button>
      </div>
    </div>
  );
}
