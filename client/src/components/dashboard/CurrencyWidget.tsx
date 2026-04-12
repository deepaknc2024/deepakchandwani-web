import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CurrencyWidget() {
  const { rate, change, changePercent, loading, updatedAt, refresh } = useCurrency();
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-bdl bg-white p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-px">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green to-cyan-2" />

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted">
          {t.dashboard.exchangeRate}
        </span>
        <button
          onClick={refresh}
          className={`text-faint transition-colors hover:text-cyan-2 ${loading ? "animate-spin" : ""}`}
          aria-label="Refresh exchange rate"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
        </button>
      </div>

      <div className="mb-1 text-[0.66rem] text-muted">{t.dashboard.usdInr}</div>

      <div className="font-syne text-3xl font-extrabold tracking-tight text-ink tabular-nums leading-none">
        {rate !== null ? `\u20b9${rate.toFixed(2)}` : "\u2014"}
      </div>

      <div className="mt-1 text-[0.63rem] text-muted">
        {rate !== null ? `1 USD = \u20b9${rate.toFixed(4)}` : t.dashboard.unavailable}
      </div>

      {change !== null && changePercent !== null && (
        <span
          className={`mt-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.66rem] font-bold ${
            change >= 0 ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fee2e2] text-[#991b1b]"
          }`}
        >
          {change >= 0 ? "\u25b2" : "\u25bc"} \u20b9{Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
        </span>
      )}

      {updatedAt && (
        <div className="mt-1 text-[0.58rem] text-faint">
          {t.dashboard.updated} {updatedAt}
        </div>
      )}
    </div>
  );
}
