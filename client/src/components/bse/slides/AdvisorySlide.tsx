import { Slide } from "../Slide";

const advisoryBullets = [
  "Deepak invited to formally join the Advisory Board \u2014 specifically for technology",
  "His linkage with the United States adds credibility for latest AI/tech capabilities",
  "Advisory board to be established within 2-3 weeks",
  "Technology meetings to remain within the tech team (Raman, Deepak, Akash)",
  "Broader strategic meetings to include all founders",
  "Regular half-hour calls for site reviews to run in parallel",
];

const docBullets = [
  "Set up Nextcloud or shared repository for centralized document storage",
  "Deepak to work with Akash on automation workflows",
  "Initial documents to be shared within ~1 week",
  "Structured, phased sharing \u2014 not a document dump",
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

export function AdvisorySlide({ isActive }: { isActive?: boolean }) {
  return (
    <Slide
      slideNumber="Slide 09 of 12"
      title="Advisory Board & Governance"
      subtitle="Strengthening credibility through formal structure"
      isActive={isActive}
    >
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        <div className="col-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-8 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="mb-4 font-space text-xl font-bold text-cyan-2">
            Advisory Board
          </h3>
          <BulletList items={advisoryBullets} />
        </div>
        <div className="col-card rounded-2xl border border-bdl/30 bg-slate-50/85 p-8 shadow-lg backdrop-blur-[14px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="mb-4 font-space text-xl font-bold text-cyan-2">
            Document Management Plan
          </h3>
          <BulletList items={docBullets} />
        </div>
      </div>
    </Slide>
  );
}
