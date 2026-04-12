import { useState, useEffect, useRef } from "react";

interface TranscriptInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function TranscriptInput({
  onSubmit,
  loading,
}: TranscriptInputProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Paste detection
  useEffect(() => {
    function handlePaste() {
      // small delay so the pasted value is in the input
      setTimeout(() => {
        if (inputRef.current?.value) {
          setUrl(inputRef.current.value);
        }
      }, 50);
    }
    const el = inputRef.current;
    el?.addEventListener("paste", handlePaste);
    return () => el?.removeEventListener("paste", handlePaste);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] via-30% to-[#164e63] px-6 py-16 text-center md:py-20">
      {/* Particles background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-[pfloat_linear_infinite] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.6),transparent)]"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 10}s`,
              animationDelay: `-${Math.random() * 10}s`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-[740px]">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a5f3fc]">
          <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
          AI-Powered Tool
        </div>

        <h1 className="mb-4 font-space text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          YouTube{" "}
          <span className="bg-gradient-to-r from-[#67e8f9] to-[#a78bfa] bg-clip-text text-transparent">
            Transcript
          </span>
          <br />
          Extractor
        </h1>

        <p className="mx-auto mb-10 max-w-[520px] text-base text-white/65">
          Paste any YouTube URL and instantly extract the full transcript
          &mdash; searchable, copyable, and downloadable.
        </p>

        {/* Input card */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-[700px] rounded-3xl border border-white/15 bg-white/7 p-6 shadow-2xl backdrop-blur-xl"
        >
          <label className="mb-3 block text-left text-sm font-bold text-white/70 tracking-wide">
            {"\ud83d\udd17"} Paste your YouTube URL
          </label>
          <div className="flex gap-3 max-sm:flex-col">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(e);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-xl border-2 border-transparent bg-white/95 px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-[#67e8f9] focus:shadow-[0_0_0_4px_rgba(103,232,249,0.15)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-br from-indigo to-cyan-2 px-6 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(79,70,229,0.5)] disabled:pointer-events-none disabled:opacity-70 max-sm:w-full"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Extracting...
                </>
              ) : (
                <>
                  {"\u26a1"} Extract
                </>
              )}
            </button>
          </div>
          <div className="mt-3 text-left text-xs text-white/45">
            Works with:{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.76rem] text-[#a5f3fc]">
              youtube.com/watch?v=...
            </code>{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.76rem] text-[#a5f3fc]">
              youtu.be/...
            </code>{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.76rem] text-[#a5f3fc]">
              youtube.com/shorts/...
            </code>
          </div>
        </form>
      </div>
    </div>
  );
}
