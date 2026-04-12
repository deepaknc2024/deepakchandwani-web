import { useFadeIn } from "@/hooks/useFadeIn";

const services = [
  {
    num: "01",
    icon: "\u{1F916}",
    title: "AI Strategy & Consulting",
    desc: "Define your AI roadmap with clarity. Identify highest-impact use cases, assess readiness, and build a practical adoption plan aligned to business goals.",
    chip: "Strategy",
    chipClass: "bg-cyan/10 text-cyan",
  },
  {
    num: "02",
    icon: "\u{1F680}",
    title: "LLM & Generative AI",
    desc: "Custom GPT-powered apps, RAG pipelines, intelligent chatbots, and document processing systems built on the latest LLM technologies.",
    chip: "Generative AI",
    chipClass: "bg-green/10 text-green",
  },
  {
    num: "03",
    icon: "\u2699\uFE0F",
    title: "AI Automation & Workflows",
    desc: "Streamline repetitive processes with intelligent automation. Workflows that save time, reduce costs, and scale seamlessly with your business.",
    chip: "Automation",
    chipClass: "bg-indigo/10 text-[#a5b4fc]",
  },
  {
    num: "04",
    icon: "\u{1F4CA}",
    title: "Predictive Analytics",
    desc: "Transform raw data into actionable insights. ML models and analytics dashboards for smarter, faster decisions across your organisation.",
    chip: "Analytics",
    chipClass: "bg-amber/10 text-amber",
  },
  {
    num: "05",
    icon: "\u{1F4D6}",
    title: "AI Training & Workshops",
    desc: "Upskill your team with hands-on workshops covering prompt engineering, AI tools, ethical AI use, and practical implementation strategies.",
    chip: "Training",
    chipClass: "bg-[rgba(56,189,248,0.1)] text-[#38bdf8]",
  },
  {
    num: "06",
    icon: "\u{1F6E0}\uFE0F",
    title: "Custom AI Development",
    desc: "End-to-end development of bespoke AI products and APIs \u2014 from prototype to production-grade systems with robust, scalable architecture.",
    chip: "Development",
    chipClass: "bg-[rgba(244,63,94,0.1)] text-[#fb7185]",
  },
];

function ServiceCard({
  svc,
}: {
  svc: (typeof services)[number];
}) {
  const fade = useFadeIn();

  return (
    <div
      ref={fade.ref}
      className={`bg-white p-9 max-md:p-7 max-[580px]:p-6 flex gap-6 max-[580px]:gap-4 items-start cursor-default transition-all duration-200 hover:bg-[#f0f9ff] group ${
        fade.visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-[22px]"
      }`}
      style={{ transition: "opacity 0.65s ease, transform 0.65s ease, background 0.2s" }}
    >
      <div className="font-syne text-[3rem] max-[580px]:text-[2rem] font-extrabold text-black/5 leading-none shrink-0 tracking-[-2px] min-w-[56px] max-[580px]:min-w-[38px] transition-colors duration-200 group-hover:text-cyan-2/[0.18]">
        {svc.num}
      </div>
      <div>
        <span className="text-[1.5rem] mb-3 block">{svc.icon}</span>
        <div className="font-syne text-[1rem] font-bold text-ink mb-2">
          {svc.title}
        </div>
        <p className="text-[0.84rem] text-muted leading-[1.75]">{svc.desc}</p>
        <span
          className={`inline-block mt-3.5 text-[0.62rem] font-bold py-0.5 px-3 rounded tracking-[0.5px] ${svc.chipClass}`}
        >
          {svc.chip}
        </span>
      </div>
    </div>
  );
}

export default function ServicesSection() {
  const headFade = useFadeIn();

  return (
    <section
      id="services"
      className="bg-light py-28 px-8 relative overflow-hidden max-[900px]:py-20 max-[580px]:py-16 max-[580px]:px-5"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-[1140px] mx-auto relative">
        {/* Header */}
        <div
          ref={headFade.ref}
          className={`text-center mb-18 transition-all duration-[650ms] ease-out ${
            headFade.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="text-[0.66rem] font-bold tracking-[2.5px] uppercase text-cyan-2 mb-3">
            What I Build
          </div>
          <h2 className="font-syne text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold tracking-[-1.2px] text-ink leading-[1.15] mb-3">
            AI Services
          </h2>
          <p className="text-muted max-w-[500px] mx-auto text-[0.95rem]">
            End-to-end AI solutions tailored to your business goals &mdash; from
            ideation to production.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 max-[900px]:grid-cols-1 bg-bdl gap-px border border-bdl rounded-[20px] overflow-hidden">
          {services.map((svc) => (
            <ServiceCard key={svc.num} svc={svc} />
          ))}
        </div>
      </div>
    </section>
  );
}
