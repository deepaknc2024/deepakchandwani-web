import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranscript } from "@/hooks/useTranscript";
import { useLanguage } from "@/contexts/LanguageContext";
import TranscriptInput from "@/components/transcript/TranscriptInput";
import TranscriptToolbar from "@/components/transcript/TranscriptToolbar";
import TranscriptSearch from "@/components/transcript/TranscriptSearch";
import TranscriptResult from "@/components/transcript/TranscriptResult";

export default function TranscriptPage() {
  const transcript = useTranscript();
  const { t } = useLanguage();
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [view, setView] = useState<"lines" | "full">("lines");
  const [searchQuery, setSearchQuery] = useState("");

  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryUsage, setSummaryUsage] = useState<{
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
    model: string;
  } | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const matchCount = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return 0;
    return transcript.lines.filter((l) => l.text.toLowerCase().includes(term)).length;
  }, [transcript.lines, searchQuery]);

  function handleSubmit(url: string) {
    setSearchQuery("");
    setView("lines");
    setShowTimestamps(true);
    setSummary("");
    setSummaryError(null);
    transcript.fetch(url);
  }

  const handleSummarize = useCallback(async () => {
    if (!transcript.lines.length) return;

    setIsSummarizing(true);
    setSummary("");
    setSummaryError(null);
    setSummaryUsage(null);
    setActiveModel(null);

    const fullText = transcript.lines.map((l) => l.text).join(" ");

    try {
      const resp = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, title: transcript.title }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Summarization failed");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      const processLines = (text: string) => {
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.model) setActiveModel(parsed.model);
            if (parsed.content) setSummary((prev) => prev + parsed.content);
            if (parsed.usage) setSummaryUsage(parsed.usage);
          } catch (e) {
            if (e instanceof Error && !e.message.includes("JSON")) throw e;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lastNewline = buffer.lastIndexOf("\n");
        if (lastNewline !== -1) {
          processLines(buffer.substring(0, lastNewline));
          buffer = buffer.substring(lastNewline + 1);
        }
      }
      if (buffer.trim()) processLines(buffer);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Summarization failed");
    } finally {
      setIsSummarizing(false);
    }
  }, [transcript.lines, transcript.title]);

  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [summary ? "has" : "no"]);

  return (
    <div className="min-h-screen bg-light">
      <TranscriptInput onSubmit={handleSubmit} loading={transcript.status === "loading"} />

      <div className="mx-auto max-w-[1000px] px-6 py-8">
        {transcript.status === "error" && transcript.error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red/30 bg-red/5 p-4">
            <span className="mt-0.5 flex-shrink-0 text-lg">{"\u26a0\ufe0f"}</span>
            <div>
              <strong className="block text-sm font-bold text-red">{t.transcript.couldNotFetch}</strong>
              <p className="text-sm text-red/80">{transcript.error}</p>
            </div>
          </div>
        )}

        {transcript.status === "loading" && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-indigo/15 border-t-indigo" />
            <h3 className="mb-1 font-space text-lg font-bold text-ink">{t.transcript.extracting}</h3>
            <p className="text-sm text-muted">{t.transcript.fetchingCaptions}</p>
          </div>
        )}

        {transcript.status === "success" && transcript.lines.length > 0 && (
          <div className="space-y-4">
            <TranscriptToolbar
              lines={transcript.lines}
              title={transcript.title}
              lineCount={transcript.lines.length}
              showTimestamps={showTimestamps}
              onToggleTimestamps={() => setShowTimestamps((v) => !v)}
              view={view}
              onChangeView={setView}
              onSummarize={handleSummarize}
              isSummarizing={isSummarizing}
            />

            {(summary || isSummarizing || summaryError) && (
              <div ref={summaryRef} className="rounded-2xl border border-cyan-2/20 bg-gradient-to-br from-cyan-2/5 to-indigo/5 p-6 shadow-lg">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-lg">{"\u2728"}</span>
                  <h3 className="font-space text-lg font-bold text-ink">{t.transcript.aiSummary}</h3>
                  {activeModel && (
                    <span className="rounded-full bg-cyan-2/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-cyan-2">{activeModel}</span>
                  )}
                  {isSummarizing && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-2/30 border-t-cyan-2" />
                  )}
                </div>

                {summaryError && (
                  <div className="rounded-xl border border-red/20 bg-red/5 p-3 text-sm text-red">{summaryError}</div>
                )}

                {summary && (
                  <div className="prose prose-sm max-w-none text-body [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-space [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-space [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-ink [&_ul]:my-2 [&_ul]:space-y-1 [&_li]:text-sm [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2 [&_strong]:text-ink [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-2/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted">
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }} />
                  </div>
                )}

                {!isSummarizing && summary && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cyan-2/10 pt-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(summary)}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-muted shadow-sm transition-all hover:text-ink"
                    >
                      {"\ud83d\udccb"} {t.transcript.copySummary}
                    </button>
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          window.speechSynthesis?.cancel();
                          const audio = document.getElementById("tts-audio") as HTMLAudioElement | null;
                          if (audio) { audio.pause(); audio.currentTime = 0; }
                          setIsSpeaking(false);
                        } else {
                          playSummary(summary, setIsSpeaking);
                        }
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
                        isSpeaking ? "bg-red/10 text-red hover:bg-red/20" : "bg-indigo/10 text-indigo hover:bg-indigo/20"
                      }`}
                    >
                      {isSpeaking ? `\u23f9 ${t.transcript.stop}` : `\ud83d\udd0a ${t.transcript.playSummary}`}
                    </button>

                    {summaryUsage && (
                      <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted">
                        <span className="rounded-md bg-white/80 px-2 py-0.5 shadow-sm">
                          {summaryUsage.model.split('/')[1] || summaryUsage.model}
                        </span>
                        <span className="rounded-md bg-white/80 px-2 py-0.5 shadow-sm" title={t.transcript.inputTokens}>
                          In: {summaryUsage.input_tokens.toLocaleString()}
                        </span>
                        <span className="rounded-md bg-white/80 px-2 py-0.5 shadow-sm" title={t.transcript.outputTokens}>
                          Out: {summaryUsage.output_tokens.toLocaleString()}
                        </span>
                        <span className="rounded-md bg-white/80 px-2 py-0.5 shadow-sm font-semibold" title={t.transcript.totalTokens}>
                          Total: {summaryUsage.total_tokens.toLocaleString()} tokens
                        </span>
                        <span className="rounded-md bg-cyan-2/10 px-2 py-0.5 font-semibold text-cyan-2 shadow-sm" title="Cost">
                          ${summaryUsage.cost_usd.toFixed(4)} USD / {"\u20b9"}{(summaryUsage.cost_usd * 85.5).toFixed(2)} INR
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <TranscriptSearch
              query={searchQuery}
              onChange={setSearchQuery}
              matchCount={matchCount}
              totalLines={transcript.lines.length}
            />

            <TranscriptResult
              lines={transcript.lines}
              title={transcript.title}
              wordCount={transcript.wordCount}
              readTime={transcript.readTime}
              videoId={transcript.videoId}
              showTimestamps={showTimestamps}
              view={view}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {transcript.status === "idle" && (
          <div className="py-16 text-center">
            <span className="mb-4 block text-5xl opacity-50">{"\ud83c\udfa6"}</span>
            <h3 className="mb-2 font-space text-xl font-bold text-ink">{t.transcript.ready}</h3>
            <p className="mx-auto max-w-sm text-sm text-muted">
              {t.transcript.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^- /gm, '')
    .replace(/^> /gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

async function playSummary(summary: string, setIsSpeaking: (v: boolean) => void) {
  const plainText = stripMarkdown(summary);
  setIsSpeaking(true);

  try {
    const resp = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: plainText, language: "en" }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.ok && data.audio) {
        let audio = document.getElementById("tts-audio") as HTMLAudioElement | null;
        if (!audio) {
          audio = document.createElement("audio");
          audio.id = "tts-audio";
          document.body.appendChild(audio);
        }
        const mime = data.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
        audio.src = `data:${mime};base64,${data.audio}`;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    }
  } catch { /* Fall through to browser TTS */ }

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  } else {
    setIsSpeaking(false);
  }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)/, '<p>$1</p>');
}
