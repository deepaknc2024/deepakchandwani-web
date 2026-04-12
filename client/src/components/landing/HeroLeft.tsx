import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroLeft() {
  const { t } = useLanguage();

  const skills = [
    t.hero.skillLLM,
    t.hero.skillAgentic,
    t.hero.skillRAG,
    t.hero.skillMLOps,
    t.hero.skillMultiModal,
    t.hero.skillVoice,
  ];

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center p-16 max-xl:p-14 max-lg:p-10 max-md:p-7 max-[580px]:p-5"
      style={{
        background: "#f0f9ff",
        backgroundImage: [
          "radial-gradient(ellipse 600px 400px at 20% 30%, rgba(6,182,212,0.09) 0%, transparent 60%)",
          "radial-gradient(ellipse 400px 400px at 85% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)",
        ].join(","),
      }}
    >
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-syne font-extrabold text-black/[0.03] leading-none tracking-[-10px] pointer-events-none select-none"
        style={{ fontSize: "min(28vw, 320px)" }}
        aria-hidden="true"
      >
        AI
      </span>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-[440px] w-full">
        <div className="inline-flex items-center gap-2 border border-cyan-2/35 rounded-[10px] py-1 px-3.5 text-[0.68rem] font-bold tracking-[1.8px] uppercase text-cyan-2 mb-8 bg-cyan-2/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-2 shrink-0 animate-[pdot_2s_ease-in-out_infinite]" />
          {t.hero.badge}
        </div>

        <h1 className="font-syne text-[clamp(1.9rem,3vw,2.7rem)] font-extrabold text-ink leading-[1.05] tracking-[-1.5px] mb-4 max-[580px]:text-[2.2rem] max-[580px]:tracking-[-1px] max-[380px]:text-[1.9rem]">
          {t.hero.name.split(' ').map((word, i) => (
            <span key={i}>{word}{i === 0 && <br />}</span>
          ))}
        </h1>

        <p className="text-[clamp(0.88rem,1.3vw,1rem)] text-cyan-2 font-semibold tracking-[0.5px] mb-4">
          {t.hero.title}
        </p>

        <p className="text-[0.88rem] text-muted leading-[1.78] mb-9 max-w-[380px]">
          {t.hero.description}
        </p>

        <div className="flex gap-3 flex-wrap mb-12 max-[580px]:flex-col">
          <a
            href="#expertise"
            className="py-3 px-6 bg-cyan-2 text-white rounded-[10px] font-bold text-[0.85rem] no-underline transition-all hover:bg-cyan hover:shadow-[0_6px_20px_rgba(6,182,212,0.4)] whitespace-nowrap"
          >
            {t.hero.cta} &rarr;
          </a>
          <a
            href="/transcript"
            className="py-3 px-5 bg-white text-body border-[1.5px] border-bdl rounded-[10px] font-semibold text-[0.85rem] no-underline transition-all hover:border-cyan-2 hover:text-cyan-2 whitespace-nowrap"
          >
            &#9889; {t.hero.aiTools}
          </a>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-9 border-t border-bdl">
          {skills.map((skill) => (
            <span
              key={skill}
              className="py-1 px-3 border border-cyan-2/25 rounded-lg text-[0.65rem] font-semibold text-cyan-2 bg-cyan-2/[0.05] tracking-[0.3px]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
