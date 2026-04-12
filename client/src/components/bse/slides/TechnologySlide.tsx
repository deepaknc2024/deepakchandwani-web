import { Slide } from "../Slide";

const pillars = [
  {
    icon: "\uD83E\uDD16",
    title: "AI Agent-Driven",
    desc: "Automated matching of givers with receivers. Agents replace manual employee processes.",
  },
  {
    icon: "\uD83C\uDF10",
    title: "Multi-Lingual",
    desc: "Serve diverse language groups across India for maximum accessibility and reach.",
  },
  {
    icon: "\uD83D\uDDE3\uFE0F",
    title: "Voice & Chat",
    desc: "Chatbot and voice chatbot interfaces for intuitive user interaction.",
  },
  {
    icon: "\u2699\uFE0F",
    title: "Customizable",
    desc: "Tailored experience for different user types \u2014 learners, givers, trainers.",
  },
];

export function TechnologySlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 06 of 12"
      title="Technology Direction & AI Strategy"
      subtitle="Building a modern, agent-driven platform"
      isActive={isActive}
    >
      <div className="grid grid-cols-4 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="quad-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-6 text-center shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="mb-2 block text-4xl">{p.icon}</span>
            <h4 className="mb-1 font-space text-base font-bold text-ink">
              {p.title}
            </h4>
            <p className="text-sm font-semibold leading-relaxed text-ink">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
      <div className="usp-banner mt-4 rounded-2xl border border-bdl/25 bg-slate-50/85 px-9 py-7 text-center shadow-md backdrop-blur-[14px]">
        <p className="text-lg font-semibold leading-relaxed text-ink">
          &ldquo;This is the latest{" "}
          <em className="not-italic font-bold text-cyan-2">
            technology-driven, agent-driven, multi-lingual, customizable
          </em>{" "}
          skills exchange.&rdquo;
          <br />
          Agents instead of employees &mdash; cost-effective, scalable, and
          available 24/7.
        </p>
      </div>
    </Slide>
  );
}
