import { Slide } from "../Slide";

const challenge = [
  "People are not reliable \u2014 trust deficit is real",
  "Supporters need assurance their money is used properly",
  "Learners may drop out mid-course",
  "Existing platforms lack transparency",
];

const approach = [
  "Direct fee transfer \u2014 no commission agent model",
  "Escrow accounts for advance payments",
  "Progress tracking matrix visible to supporters",
  "Steady progress reports from institutes",
  "Technology-driven transparency at every step",
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-0">
      {items.map((item, i) => (
        <li
          key={i}
          className="bullet-item relative py-1.5 pl-7 text-lg font-semibold leading-relaxed text-ink before:absolute before:left-0 before:top-2.5 before:h-2 before:w-2 before:rounded-full before:bg-gradient-to-br before:from-cyan-2 before:to-indigo"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TrustSlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 05 of 12"
      title="Trust & Accountability Framework"
      subtitle="Building credibility into the platform"
      isActive={isActive}
    >
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        <div className="col-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-8 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="mb-4 font-space text-xl font-bold text-cyan-2">
            The Challenge
          </h3>
          <BulletList items={challenge} />
        </div>
        <div className="col-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-8 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="mb-4 font-space text-xl font-bold text-cyan-2">
            Our Approach
          </h3>
          <BulletList items={approach} />
        </div>
      </div>
    </Slide>
  );
}
