import { Slide } from "../Slide";

const cards = [
  {
    title: "Founder Structure",
    desc: "Of four founders, only one needs to be financially sustained by the organization. The other three are self-sufficient \u2014 reducing burn rate significantly.",
  },
  {
    title: "Growth Path",
    desc: "Three founders have come together to make one sustainable. Over months and years, the organization grows into a self-sustaining entity.",
  },
  {
    title: "Revenue Model",
    desc: "Subscription-based platform \u2014 no commission agent model. Direct fee flow from supporters to trainers ensures trust and efficiency.",
  },
  {
    title: "Funding Strategy",
    desc: "Once the platform demonstrates traction and technology maturity, external funding becomes easier. Technology quality attracts investors.",
  },
];

export function SustainabilitySlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 08 of 12"
      title="Sustainability Model"
      subtitle="Path to financial self-sufficiency"
      isActive={isActive}
    >
      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        {cards.map((c) => (
          <div
            key={c.title}
            className="sus-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-7 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <h4 className="mb-2 font-space text-lg font-bold text-cyan-2">
              {c.title}
            </h4>
            <p className="text-base font-semibold leading-relaxed text-ink">
              {c.desc}
            </p>
          </div>
        ))}
      </div>
    </Slide>
  );
}
