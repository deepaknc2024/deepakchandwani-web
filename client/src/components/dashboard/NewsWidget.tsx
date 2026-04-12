import { useState, useMemo } from "react";
import { useNews } from "@/hooks/useNews";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NewsItem } from "@/types";

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function NewsCard({ item, flag }: { item: NewsItem; flag: string }) {
  const date = formatRelativeDate(item.date);
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-bdl bg-white p-3 transition-all hover:-translate-y-px hover:border-[#7dd3fc] hover:bg-[#e0f2fe] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
    >
      <div className="mb-1 text-[0.58rem] font-bold uppercase tracking-widest text-cyan-2">{flag}</div>
      <div className="line-clamp-3 text-[0.78rem] font-semibold leading-snug text-ink">{item.title}</div>
      <div className="mt-1 text-[0.6rem] text-faint">
        {date ? `${date} \u00b7 ` : ""}{item.src || "News"}
      </div>
    </a>
  );
}

export default function NewsWidget() {
  const { usItems, inItems, loading } = useNews();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"us" | "in">("us");

  const items = activeTab === "us" ? usItems : inItems;
  const flag = activeTab === "us" ? `\ud83c\uddfa\ud83c\uddf8 ${t.dashboard.usa}` : `\ud83c\uddee\ud83c\uddf3 ${t.dashboard.india}`;

  const tickerItems = useMemo(() => {
    const all = [...usItems, ...inItems];
    return [...all, ...all];
  }, [usItems, inItems]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-bdl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-px">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo to-amber" />

      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted">{t.dashboard.headlines}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("us")}
            className={`rounded-lg border px-2.5 py-0.5 text-[0.65rem] font-semibold transition-all ${
              activeTab === "us" ? "border-[#a5f3fc] bg-[#ecfeff] text-cyan-2" : "border-bdl bg-white text-muted hover:text-body"
            }`}
          >
            {t.dashboard.usa}
          </button>
          <button
            onClick={() => setActiveTab("in")}
            className={`rounded-lg border px-2.5 py-0.5 text-[0.65rem] font-semibold transition-all ${
              activeTab === "in" ? "border-[#a5f3fc] bg-[#ecfeff] text-cyan-2" : "border-bdl bg-white text-muted hover:text-body"
            }`}
          >
            {t.dashboard.india}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-22 animate-pulse rounded-xl bg-light-2 border border-bdl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted">{t.dashboard.newsUnavailable}</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {items.slice(0, 4).map((item, i) => (
            <NewsCard key={i} item={item} flag={flag} />
          ))}
        </div>
      )}

      {tickerItems.length > 0 && (
        <div
          className="mt-3 overflow-hidden border-t border-bdl pt-2"
          style={{
            maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
          }}
        >
          <div className="flex animate-[tick_55s_linear_infinite] gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
            {tickerItems.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs text-muted">
                <span className="text-[0.56rem] text-cyan-2">{"\u25b8"}</span>
                {item.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
