import { Slide } from "../Slide";

const actors = [
  {
    icon: "\uD83C\uDF93",
    title: "LEARNER",
    desc: "Subscribes to the platform. Wants to learn a skill but cannot afford the training fees.",
  },
  {
    icon: "\uD83E\uDD1D",
    title: "SUPPORTER / GIVER",
    desc: "Wants to contribute financially to skill development. Chooses which skill and how much to support.",
  },
  {
    icon: "\uD83C\uDFEB",
    title: "TRAINER / INSTITUTE",
    desc: "Provides the actual training program. Receives fees directly. Sends progress reports.",
  },
];

const bullets = [
  "AI agents automatically match givers with eligible learners and training institutes",
  "Supporter pays an advance fee (6 months) directly to the trainer \u2014 no middleman commission",
  "Progress reports from the institute go directly to the supporter for transparency",
  "If a learner drops out mid-training, remaining funds return to the supporter\u2019s escrow account",
];

export function PlatformSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 04 of 12"
      title="Platform Concept \u2014 Skills Exchange Model"
      subtitle="How the Bharat Skills Exchange works"
      isActive={isActive}
    >
      <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
        {actors.map((a) => (
          <div
            key={a.title}
            className="tri-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-6 text-center shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="mb-2 block text-4xl">{a.icon}</span>
            <h4 className="mb-1 font-space text-lg font-bold text-ink">
              {a.title}
            </h4>
            <p className="text-base font-semibold leading-relaxed text-ink">
              {a.desc}
            </p>
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-col gap-0 rounded-2xl border border-slate-300/20 bg-light/60 px-6 py-4 shadow-md backdrop-blur-xl">
        {bullets.map((item, i) => (
          <li
            key={i}
            className="bullet-item relative py-1.5 pl-7 text-lg font-semibold leading-relaxed text-ink before:absolute before:left-0 before:top-2.5 before:h-2 before:w-2 before:rounded-full before:bg-gradient-to-br before:from-cyan-2 before:to-indigo"
          >
            {item}
          </li>
        ))}
      </ul>
    </Slide>
  );
}
