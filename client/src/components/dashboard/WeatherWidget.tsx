import { useWeather } from "@/hooks/useWeather";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WeatherWidget() {
  const { days, loading } = useWeather();
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-bdl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-px">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-2 to-indigo" />

      <div className="mb-3 text-[0.62rem] font-bold uppercase tracking-widest text-muted">
        {t.dashboard.nycForecast}
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-light-2" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted">{t.dashboard.weatherUnavailable}</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              className={`cursor-default rounded-xl border p-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
                i === 0
                  ? "border-[#38bdf8] bg-[#e0f2fe]"
                  : "border-bdl bg-white hover:border-[#7dd3fc] hover:bg-[#e0f2fe]"
              }`}
            >
              <div className={`text-[0.62rem] font-bold uppercase tracking-wide ${i === 0 ? "text-cyan-2" : "text-muted"}`}>
                {day.name}
              </div>
              <div className="my-1 text-xl leading-none">{day.icon}</div>
              <div className="text-sm font-extrabold text-ink">{day.high}&deg;</div>
              <div className="text-[0.68rem] text-muted">{day.low}&deg;</div>
              {day.rainChance > 20 && (
                <div className="mt-0.5 text-[0.6rem] font-semibold text-cyan-2">{"\ud83d\udca7"}{day.rainChance}%</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
