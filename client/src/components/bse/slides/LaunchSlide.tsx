import { Slide } from "../Slide";

const communicate = [
  { bold: "Who", rest: "Who are the founders?" },
  { bold: "When", rest: "Timeline and milestones" },
  { bold: "Where", rest: "Geographic and digital reach" },
  { bold: "Why", rest: "Why are we coming together?" },
  { bold: "How", rest: "How will it work?" },
];

const launchBullets = [
  "Paused launch for proper testing",
  "Soft launch only after website is ready",
  "Voice features to be available on site",
  "Unique features highlighted before announce",
  "Credibility established first \u2014 then scale",
];

export function LaunchSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 07 of 12"
      title="Website & Launch Strategy"
      subtitle="Measured approach \u2014 quality over speed"
      isActive={isActive}
    >
      <div className="quote-block rounded-r-2xl border-l-4 border-l-cyan-2 bg-white/[0.88] px-9 py-7 shadow-lg backdrop-blur-[20px]">
        <p className="text-xl font-bold italic leading-relaxed text-ink">
          &ldquo;A month is a year in AI. We are in no rush to announce. We will
          constantly evaluate and review.&rdquo;
        </p>
      </div>
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        <div className="col-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-8 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="mb-4 font-space text-xl font-bold text-cyan-2">
            Website Must Communicate
          </h3>
          <ul className="flex flex-col gap-0">
            {communicate.map((item, i) => (
              <li
                key={i}
                className="bullet-item relative py-1.5 pl-7 text-lg font-semibold leading-relaxed text-ink before:absolute before:left-0 before:top-2.5 before:h-2 before:w-2 before:rounded-full before:bg-gradient-to-br before:from-cyan-2 before:to-indigo"
              >
                <strong>{item.bold}</strong> &mdash; {item.rest}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-8 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="mb-4 font-space text-xl font-bold text-cyan-2">
            Launch Approach
          </h3>
          <ul className="flex flex-col gap-0">
            {launchBullets.map((item, i) => (
              <li
                key={i}
                className="bullet-item relative py-1.5 pl-7 text-lg font-semibold leading-relaxed text-ink before:absolute before:left-0 before:top-2.5 before:h-2 before:w-2 before:rounded-full before:bg-gradient-to-br before:from-cyan-2 before:to-indigo"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Slide>
  );
}
