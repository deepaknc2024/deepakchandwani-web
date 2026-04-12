import { useFadeIn } from "@/hooks/useFadeIn";

const expertise = [
  {
    num: "01",
    icon: "\u{1F9E0}",
    title: "Large Language Models",
    desc: "Fine-tuning, prompt engineering, function calling, structured output, and production-grade LLM pipelines across GPT, Claude, Gemini, and open-source models.",
    chip: "LLM Engineering",
    chipClass: "bg-cyan/10 text-cyan",
  },
  {
    num: "02",
    icon: "\u{1F916}",
    title: "Agentic AI Systems",
    desc: "Autonomous AI agents with tool use, multi-step reasoning, memory, and orchestration — from single agents to complex multi-agent architectures.",
    chip: "Agentic AI",
    chipClass: "bg-green/10 text-green",
  },
  {
    num: "03",
    icon: "\u{1F50D}",
    title: "RAG & Knowledge Systems",
    desc: "Retrieval-augmented generation with vector databases, hybrid search, re-ranking, chunking strategies, and context-aware document intelligence.",
    chip: "RAG",
    chipClass: "bg-indigo/10 text-[#a5b4fc]",
  },
  {
    num: "04",
    icon: "\u{1F5E3}",
    title: "Voice & Conversational AI",
    desc: "Real-time voice interfaces, speech-to-text, text-to-speech, multi-lingual voice bots, and WebSocket-based streaming audio architectures.",
    chip: "Voice AI",
    chipClass: "bg-amber/10 text-amber",
  },
  {
    num: "05",
    icon: "\u2699\uFE0F",
    title: "AI Automation & MLOps",
    desc: "End-to-end ML pipelines, model serving, CI/CD for AI, monitoring, A/B testing, and scalable deployment on cloud infrastructure.",
    chip: "MLOps",
    chipClass: "bg-[rgba(56,189,248,0.1)] text-[#38bdf8]",
  },
  {
    num: "06",
    icon: "\u{1F310}",
    title: "Multi-modal & Emerging AI",
    desc: "Vision-language models, image generation, video understanding, multi-lingual systems, and cutting-edge research applied to production use cases.",
    chip: "Multi-modal",
    chipClass: "bg-[rgba(244,63,94,0.1)] text-[#fb7185]",
  },
];

function ExpertiseCard({
  item,
}: {
  item: (typeof expertise)[number];
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
        {item.num}
      </div>
      <div>
        <span className="text-[1.5rem] mb-3 block">{item.icon}</span>
        <div className="font-syne text-[1rem] font-bold text-ink mb-2">
          {item.title}
        </div>
        <p className="text-[0.84rem] text-muted leading-[1.75]">{item.desc}</p>
        <span
          className={`inline-block mt-3.5 text-[0.62rem] font-bold py-0.5 px-3 rounded tracking-[0.5px] ${item.chipClass}`}
        >
          {item.chip}
        </span>
      </div>
    </div>
  );
}

export default function ServicesSection() {
  const headFade = useFadeIn();

  return (
    <section
      id="expertise"
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
            Areas of Expertise
          </div>
          <h2 className="font-syne text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold tracking-[-1.2px] text-ink leading-[1.15] mb-3">
            Technical Depth
          </h2>
          <p className="text-muted max-w-[520px] mx-auto text-[0.95rem]">
            Deep, hands-on expertise across the modern AI stack &mdash; from
            foundational models to production-grade intelligent systems.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 max-[900px]:grid-cols-1 bg-bdl gap-px border border-bdl rounded-[20px] overflow-hidden">
          {expertise.map((item) => (
            <ExpertiseCard key={item.num} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
