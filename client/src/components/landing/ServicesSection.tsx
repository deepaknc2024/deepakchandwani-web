import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExpertiseItem {
  num: string;
  icon: string;
  title: string;
  desc: string;
  chip: string;
  chipClass: string;
}

function ExpertiseCard({ item }: { item: ExpertiseItem }) {
  const fade = useFadeIn();

  return (
    <div
      ref={fade.ref}
      className={`bg-white p-9 max-md:p-7 max-[580px]:p-6 flex gap-6 max-[580px]:gap-4 items-start cursor-default transition-all duration-200 hover:bg-[#f0f9ff] group ${
        fade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]"
      }`}
      style={{ transition: "opacity 0.65s ease, transform 0.65s ease, background 0.2s" }}
    >
      <div className="font-syne text-[3rem] max-[580px]:text-[2rem] font-extrabold text-black/5 leading-none shrink-0 tracking-[-2px] min-w-[56px] max-[580px]:min-w-[38px] transition-colors duration-200 group-hover:text-cyan-2/[0.18]">
        {item.num}
      </div>
      <div>
        <span className="text-[1.5rem] mb-3 block">{item.icon}</span>
        <div className="font-syne text-[1rem] font-bold text-ink mb-2">{item.title}</div>
        <p className="text-[0.84rem] text-muted leading-[1.75]">{item.desc}</p>
        <span className={`inline-block mt-3.5 text-[0.62rem] font-bold py-0.5 px-3 rounded tracking-[0.5px] ${item.chipClass}`}>
          {item.chip}
        </span>
      </div>
    </div>
  );
}

export default function ServicesSection() {
  const { t } = useLanguage();
  const headFade = useFadeIn();

  const expertise: ExpertiseItem[] = [
    { num: "01", icon: "\u{1F9E0}", title: t.services.card1Title, desc: t.services.card1Desc, chip: t.services.card1Title, chipClass: "bg-cyan/10 text-cyan" },
    { num: "02", icon: "\u{1F916}", title: t.services.card2Title, desc: t.services.card2Desc, chip: t.services.card2Title, chipClass: "bg-green/10 text-green" },
    { num: "03", icon: "\u{1F50D}", title: t.services.card3Title, desc: t.services.card3Desc, chip: t.services.card3Title, chipClass: "bg-indigo/10 text-[#a5b4fc]" },
    { num: "04", icon: "\u{1F5E3}", title: t.services.card4Title, desc: t.services.card4Desc, chip: t.services.card4Title, chipClass: "bg-amber/10 text-amber" },
    { num: "05", icon: "\u2699\uFE0F", title: t.services.card5Title, desc: t.services.card5Desc, chip: t.services.card5Title, chipClass: "bg-[rgba(56,189,248,0.1)] text-[#38bdf8]" },
    { num: "06", icon: "\u{1F310}", title: t.services.card6Title, desc: t.services.card6Desc, chip: t.services.card6Title, chipClass: "bg-[rgba(244,63,94,0.1)] text-[#fb7185]" },
  ];

  return (
    <section
      id="expertise"
      className="bg-light py-28 px-8 relative overflow-hidden max-[900px]:py-20 max-[580px]:py-16 max-[580px]:px-5"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-[1140px] mx-auto relative">
        <div
          ref={headFade.ref}
          className={`text-center mb-18 transition-all duration-[650ms] ease-out ${
            headFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="text-[0.66rem] font-bold tracking-[2.5px] uppercase text-cyan-2 mb-3">
            {t.services.sectionLabel}
          </div>
          <h2 className="font-syne text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold tracking-[-1.2px] text-ink leading-[1.15] mb-3">
            {t.services.heading}
          </h2>
          <p className="text-muted max-w-[520px] mx-auto text-[0.95rem]">
            {t.services.description}
          </p>
        </div>

        <div className="grid grid-cols-2 max-[900px]:grid-cols-1 bg-bdl gap-px border border-bdl rounded-[20px] overflow-hidden">
          {expertise.map((item) => (
            <ExpertiseCard key={item.num} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
