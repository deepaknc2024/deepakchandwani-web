import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutSection() {
  const { t } = useLanguage();
  const textFade = useFadeIn();
  const visualFade = useFadeIn();

  const tags = [
    { label: t.about.expLLM, hot: true },
    { label: t.about.expAgentic, hot: true },
    { label: t.about.expRAG, hot: false },
    { label: t.about.expMultiModal, hot: false },
    { label: t.about.expVoice, hot: true },
    { label: t.about.expMLOps, hot: false },
    { label: t.about.expAutomation, hot: true },
    { label: t.about.expEthics, hot: false },
  ];

  return (
    <section id="about" className="py-28 px-8 bg-white max-[900px]:py-20 max-[580px]:py-16 max-[580px]:px-5">
      <div className="max-w-[1140px] mx-auto grid grid-cols-[1.1fr_1fr] gap-24 items-center max-lg:grid-cols-1 max-lg:gap-12 max-md:gap-8">
        <div
          ref={textFade.ref}
          className={`transition-all duration-[650ms] ease-out ${
            textFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="text-[0.66rem] font-bold tracking-[2.5px] uppercase text-cyan-2 mb-3">
            {t.about.sectionLabel}
          </div>
          <h2 className="font-syne text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold tracking-[-1.2px] text-ink leading-[1.15] mb-6">
            {t.about.heading}
          </h2>
          <p className="text-muted text-[0.97rem] leading-[1.8] mb-4">{t.about.para1}</p>
          <p className="text-muted text-[0.97rem] leading-[1.8] mb-4">{t.about.para2}</p>
          <p className="text-muted text-[0.97rem] leading-[1.8] mb-4">{t.about.para3}</p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <a
              href="#expertise"
              className="py-3 px-6 bg-ink text-white rounded-md font-bold text-[0.85rem] no-underline transition-all hover:bg-dark-2 hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)]"
            >
              {t.about.ctaExpertise} &rarr;
            </a>
            <a
              href="#contact"
              className="py-3 px-5 border-[1.5px] border-bdl text-body rounded-md font-semibold text-[0.85rem] no-underline transition-all hover:border-cyan-2 hover:text-cyan-2"
            >
              {t.about.ctaConnect}
            </a>
          </div>
        </div>

        <div
          ref={visualFade.ref}
          className={`relative transition-all duration-[650ms] ease-out ${
            visualFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="bg-light-2 border border-bdl rounded-[20px] p-12 text-center relative overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.1)]">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-2 to-indigo" />
            <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-cyan-2 to-indigo mx-auto mb-5 flex items-center justify-center text-[2.8rem] shadow-[0_8px_30px_rgba(6,182,212,0.25)]">
              &#128100;
            </div>
            <h3 className="font-syne text-[1.25rem] font-extrabold text-ink mb-1">
              {t.hero.name}
            </h3>
            <p className="text-muted text-[0.85rem]">{t.about.roleTitle}</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-6">
              {tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`py-1 px-3 border rounded-lg text-[0.68rem] font-medium ${
                    tag.hot
                      ? "border-cyan-2/30 text-cyan-2 bg-cyan-2/[0.06]"
                      : "border-bdl text-muted"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute -top-3.5 -right-4.5 bg-white rounded-[10px] py-2 px-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.1)] flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink animate-[bob_3s_ease-in-out_infinite] max-lg:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[0.85rem] bg-[#ecfdf5]">&#9989;</div>
            {t.about.tagLLM}
          </div>
          <div className="absolute bottom-4.5 -left-5.5 bg-white rounded-[10px] py-2 px-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.1)] flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink animate-[bob_3.5s_ease-in-out_infinite_0.5s] max-lg:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[0.85rem] bg-[#eff6ff]">&#129302;</div>
            {t.about.tagArchitect}
          </div>
          <div className="absolute top-[40%] -right-7 bg-white rounded-[10px] py-2 px-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.1)] flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink animate-[bob_4s_ease-in-out_infinite_1s] max-lg:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[0.85rem] bg-[#fefce8]">&#11088;</div>
            {t.about.tagPioneer}
          </div>
        </div>
      </div>
    </section>
  );
}
