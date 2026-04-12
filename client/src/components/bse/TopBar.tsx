import { useLanguage } from "@/contexts/LanguageContext";

interface TopBarProps {
  current: number;
  total: number;
  isAutoplaying: boolean;
  goTo: (idx: number) => void;
  startAutoplay: () => void;
  stopAutoplay: () => void;
  restart: () => void;
}

export function TopBar({
  current,
  total,
  isAutoplaying,
  goTo,
  startAutoplay,
  stopAutoplay,
  restart,
}: TopBarProps) {
  const { t } = useLanguage();
  const progress = ((current + 1) / total) * 100;

  return (
    <>
      <div
        className="fixed left-0 top-0 h-1 rounded-r-sm transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #0891b2, #4f46e5, #a855f7)",
          zIndex: 600,
        }}
      />

      <div
        className="fixed left-0 right-0 top-0 flex h-[52px] items-center justify-between border-b border-slate-500/40 px-7 backdrop-blur-[14px]"
        style={{
          zIndex: 600,
          background: "rgba(30,41,59,0.85)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-light-3 transition-colors hover:text-cyan"
          >
            &larr; {t.bse.topBarHome}
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full border-none p-0 transition-all duration-300 ${
                  i === current
                    ? "w-6 rounded bg-gradient-to-r from-cyan-2 to-indigo"
                    : "w-2 cursor-pointer bg-faint/50 hover:bg-bdl"
                }`}
              />
            ))}
          </div>
          <span className="whitespace-nowrap font-space text-xs font-semibold tracking-wide text-light-3">
            {current + 1} / {total}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {current > 0 && (
            <button
              onClick={restart}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg border-[1.5px] border-slate-500/50 bg-transparent px-3.5 py-1 font-dm text-xs font-semibold text-light-3 transition-all hover:border-cyan-2 hover:text-cyan-2"
            >
              &#8634; <span className="max-sm:hidden">{t.bse.topBarRestart}</span>
            </button>
          )}
          <button
            onClick={isAutoplaying ? stopAutoplay : startAutoplay}
            className={`flex items-center gap-1 whitespace-nowrap rounded-lg border-[1.5px] px-3.5 py-1 font-dm text-xs font-semibold transition-all ${
              isAutoplaying
                ? "border-cyan-2 bg-cyan-2 text-white hover:bg-cyan-2/80"
                : "border-slate-500/50 bg-transparent text-light-3 hover:border-cyan-2 hover:text-cyan-2"
            }`}
          >
            {isAutoplaying ? (
              <>&#9646;&#9646; <span className="max-sm:hidden">{t.bse.topBarPause}</span></>
            ) : (
              <>&#9654; <span className="max-sm:hidden">{t.bse.topBarAutoplay}</span></>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
