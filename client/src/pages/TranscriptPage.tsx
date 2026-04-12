import { useState, useMemo } from "react";
import { useTranscript } from "@/hooks/useTranscript";
import TranscriptInput from "@/components/transcript/TranscriptInput";
import TranscriptToolbar from "@/components/transcript/TranscriptToolbar";
import TranscriptSearch from "@/components/transcript/TranscriptSearch";
import TranscriptResult from "@/components/transcript/TranscriptResult";

export default function TranscriptPage() {
  const transcript = useTranscript();
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [view, setView] = useState<"lines" | "full">("lines");
  const [searchQuery, setSearchQuery] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const matchCount = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return 0;
    return transcript.lines.filter((l) =>
      l.text.toLowerCase().includes(term)
    ).length;
  }, [transcript.lines, searchQuery]);

  function handleSubmit(url: string) {
    setVideoUrl(url);
    setSearchQuery("");
    setView("lines");
    setShowTimestamps(true);
    transcript.fetch(url);
  }

  return (
    <div className="min-h-screen bg-light">
      <TranscriptInput
        onSubmit={handleSubmit}
        loading={transcript.status === "loading"}
      />

      <div className="mx-auto max-w-[1000px] px-6 py-8">
        {/* Error state */}
        {transcript.status === "error" && transcript.error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red/30 bg-red/5 p-4">
            <span className="mt-0.5 flex-shrink-0 text-lg">
              {"\u26a0\ufe0f"}
            </span>
            <div>
              <strong className="block text-sm font-bold text-red">
                Could not fetch transcript
              </strong>
              <p className="text-sm text-red/80">{transcript.error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {transcript.status === "loading" && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-indigo/15 border-t-indigo" />
            <h3 className="mb-1 font-space text-lg font-bold text-ink">
              Extracting Transcript...
            </h3>
            <p className="text-sm text-muted">
              Fetching captions from YouTube
            </p>
          </div>
        )}

        {/* Results */}
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
            />

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
              videoUrl={videoUrl}
              showTimestamps={showTimestamps}
              view={view}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {/* Empty / idle state */}
        {transcript.status === "idle" && (
          <div className="py-16 text-center">
            <span className="mb-4 block text-5xl opacity-50">
              {"\ud83c\udfa6"}
            </span>
            <h3 className="mb-2 font-space text-xl font-bold text-ink">
              Ready to extract a transcript
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted">
              Paste a YouTube video URL above and click{" "}
              <strong>Extract</strong> to get the full transcript instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
