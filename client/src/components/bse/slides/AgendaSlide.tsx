import { Slide } from "../Slide";

const topics = [
  { num: "01", title: "Mission Statement & Vision", desc: "Why we exist and what we stand for" },
  { num: "02", title: "Platform Concept", desc: "Skills Exchange Model explained" },
  { num: "03", title: "Trust & Accountability", desc: "Building credibility into the platform" },
  { num: "04", title: "Technology & AI", desc: "Agent-driven platform direction" },
  { num: "05", title: "Website & Launch", desc: "Measured approach to going live" },
  { num: "06", title: "Sustainability", desc: "Path to financial self-sufficiency" },
  { num: "07", title: "Advisory Board", desc: "Governance & formal structure" },
  { num: "08", title: "Document Management", desc: "Collaboration & centralized storage" },
  { num: "09", title: "Action Items", desc: "Next steps & commitments" },
];

export function AgendaSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 02 of 12"
      title="Meeting Agenda"
      subtitle="Topics covered during the session"
      isActive={isActive}
    >
      <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
        {topics.map((t) => (
          <div
            key={t.num}
            className="tri-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-6 text-center shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-1 font-space text-2xl font-bold text-cyan-2">
              {t.num}
            </div>
            <h4 className="mb-1 font-space text-lg font-bold text-ink">
              {t.title}
            </h4>
            <p className="text-base font-semibold leading-relaxed text-ink">
              {t.desc}
            </p>
          </div>
        ))}
      </div>
    </Slide>
  );
}
