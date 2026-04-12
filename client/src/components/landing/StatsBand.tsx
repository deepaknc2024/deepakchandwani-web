import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StatsBand() {
  const { t } = useLanguage();
  const fade = useFadeIn();

  const expertise = [
    { icon: "\u{1F9E0}", label: t.stats.stat1 },
    { icon: "\u{1F916}", label: t.stats.stat2 },
    { icon: "\u{1F50D}", label: t.stats.stat3 },
    { icon: "\u{1F3AF}", label: t.stats.stat4 },
    { icon: "\u{1F5E3}", label: t.stats.stat5 },
    { icon: "\u26A1", label: t.stats.stat6 },
    { icon: "\u{1F310}", label: t.stats.stat7 },
    { icon: "\u{1F6E1}", label: t.stats.stat8 },
  ];

  return (
    <div
      ref={fade.ref}
      className={`bg-gradient-to-r from-ink via-dark-2 to-ink py-12 px-8 max-[580px]:py-8 max-[580px]:px-5 transition-all duration-700 ${
        fade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.6rem] font-bold tracking-[3px] uppercase text-cyan-2/70 mb-1">
            {t.stats.sectionLabel}
          </div>
          <h3 className="font-syne text-lg font-bold text-white/90 tracking-[-0.5px]">
            {t.stats.heading}
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[480px]:grid-cols-2">
          {expertise.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-all hover:border-cyan-2/30 hover:bg-cyan-2/[0.05]"
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="text-[0.75rem] font-medium text-white/75 leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
