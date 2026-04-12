import { Slide } from "../Slide";

const decisions = [
  "No rush to launch \u2014 quality and thorough testing take priority over speed",
  "Deepak to join the technology advisory board formally, adding US-based AI credibility",
  "Platform will be agent-driven, not employee-driven \u2014 maximizing cost efficiency and scalability",
  "Trust and transparency are non-negotiable core values of the platform",
  "Nextcloud or equivalent tool to be deployed for centralized document collaboration",
  "Constant evaluation and review process before any public announcement",
  "Website must clearly articulate the Who, When, Where, Why, and How",
  "Subscription model with no commission \u2014 direct fund flow from supporter to trainer",
];

export function DecisionsSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 11 of 12"
      title="Key Decisions"
      subtitle="Agreements reached during this meeting"
      isActive={isActive}
    >
      <ol className="flex flex-col gap-3" style={{ counterReset: "dec" }}>
        {decisions.map((d, i) => (
          <li
            key={i}
            className="decision-item flex items-start gap-4 rounded-2xl border border-bdl/30 bg-slate-50/85 px-5 py-4 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:translate-x-1.5 hover:shadow-xl"
          >
            <span className="flex h-[34px] min-w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-cyan-2 to-indigo font-space text-base font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-1 text-base font-semibold leading-relaxed text-ink">
              {d}
            </span>
          </li>
        ))}
      </ol>
    </Slide>
  );
}
