import { useFadeIn } from "@/hooks/useFadeIn";

const expertise = [
  { icon: "\u{1F9E0}", label: "Large Language Models & Generative AI" },
  { icon: "\u{1F916}", label: "Agentic AI & Autonomous Systems" },
  { icon: "\u{1F50D}", label: "RAG & Knowledge Retrieval" },
  { icon: "\u{1F3AF}", label: "MLOps & Production Deployment" },
  { icon: "\u{1F5E3}", label: "Voice AI & Conversational Interfaces" },
  { icon: "\u26A1", label: "Intelligent Process Automation" },
  { icon: "\u{1F310}", label: "Multi-modal & Multi-lingual AI" },
  { icon: "\u{1F6E1}", label: "Responsible & Ethical AI" },
];

export default function StatsBand() {
  const fade = useFadeIn();

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
            Core Competencies
          </div>
          <h3 className="font-syne text-lg font-bold text-white/90 tracking-[-0.5px]">
            Deep Expertise Across the AI Stack
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
