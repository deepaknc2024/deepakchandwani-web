import { Slide } from "../Slide";

export function MissionSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 03 of 12"
      title="Mission Statement & Vision"
      subtitle="Why we exist"
      isActive={isActive}
    >
      <div className="content-text rounded-2xl border border-slate-300/20 bg-light/60 p-6 text-lg font-semibold leading-relaxed text-ink shadow-md backdrop-blur-xl">
        Four founders have come together to fill the deficit gap of unskilled
        workers in this country &mdash; a gap that is very wide. While many
        other projects exist in this space, this initiative aims to
        differentiate itself through technology, trust, and direct impact.
      </div>
      <ul className="flex flex-col gap-0 rounded-2xl border border-slate-300/20 bg-light/60 px-6 py-4 shadow-md backdrop-blur-xl">
        {[
          "The unskilled workforce gap in India is massive and underserved",
          "Existing initiatives lack technology-driven trust mechanisms",
          "The platform connects those who want to give with those who need to learn",
          "Four founders bring complementary strengths \u2014 sustainability, reach, technology, and credibility",
        ].map((item, i) => (
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
