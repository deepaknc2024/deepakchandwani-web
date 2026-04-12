import { useLanguage } from "@/contexts/LanguageContext";

interface TranscriptSearchProps {
  query: string;
  onChange: (q: string) => void;
  matchCount: number;
  totalLines: number;
}

export default function TranscriptSearch({ query, onChange, matchCount, totalLines }: TranscriptSearchProps) {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted">{"\ud83d\udd0d"}</span>
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.transcript.searchPlaceholder}
        className="w-full rounded-xl border border-indigo/15 bg-white py-3 pl-10 pr-24 text-sm text-ink outline-none transition-all focus:border-indigo focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]"
      />
      {query.trim() && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
          {matchCount} {t.transcript.of} {totalLines} {matchCount !== 1 ? t.transcript.matches : t.transcript.match}
        </span>
      )}
    </div>
  );
}
