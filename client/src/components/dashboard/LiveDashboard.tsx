import WorldClocks from "./WorldClocks";
import CurrencyWidget from "./CurrencyWidget";
import WeatherWidget from "./WeatherWidget";
import NewsWidget from "./NewsWidget";
import { useClocks } from "@/hooks/useClocks";

export default function LiveDashboard() {
  const { dashTime } = useClocks();

  return (
    <div className="flex w-full flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-bdl pb-3.5">
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-cyan-2 animate-[lping_1.8s_ease-out_infinite]" />
        <span className="text-[0.68rem] font-bold uppercase tracking-[2px] text-body">
          Live Global Intelligence
        </span>
        <span className="ml-auto text-[0.68rem] tabular-nums text-muted">
          {dashTime}
        </span>
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-2 gap-3.5 max-[380px]:grid-cols-1">
        {/* Clocks card */}
        <div className="relative overflow-hidden rounded-2xl border border-bdl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-px">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo to-cyan" />
          <div className="mb-3 text-[0.62rem] font-bold uppercase tracking-widest text-muted">
            World Clocks
          </div>
          <WorldClocks />
        </div>

        {/* Currency */}
        <CurrencyWidget />
      </div>

      {/* Weather - full width */}
      <WeatherWidget />

      {/* News - full width */}
      <NewsWidget />
    </div>
  );
}
