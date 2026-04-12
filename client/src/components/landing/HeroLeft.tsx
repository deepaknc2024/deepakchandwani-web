export default function HeroLeft() {
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center p-16 max-xl:p-14 max-lg:p-10 max-md:p-7 max-[580px]:p-5"
      style={{
        background: "#f0f9ff",
        backgroundImage: [
          "radial-gradient(ellipse 600px 400px at 20% 30%, rgba(6,182,212,0.09) 0%, transparent 60%)",
          "radial-gradient(ellipse 400px 400px at 85% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)",
        ].join(","),
      }}
    >
      {/* Watermark "AI" */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-syne font-extrabold text-black/[0.03] leading-none tracking-[-10px] pointer-events-none select-none"
        style={{ fontSize: "min(28vw, 320px)" }}
        aria-hidden="true"
      >
        AI
      </span>

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[440px] w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-cyan-2/35 rounded-[10px] py-1 px-3.5 text-[0.68rem] font-bold tracking-[1.8px] uppercase text-cyan-2 mb-8 bg-cyan-2/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-2 shrink-0 animate-[pdot_2s_ease-in-out_infinite]" />
          Available for AI Projects
        </div>

        {/* Name */}
        <h1 className="font-syne text-[clamp(1.9rem,3vw,2.7rem)] font-extrabold text-ink leading-[1.05] tracking-[-1.5px] mb-4 max-[580px]:text-[2.2rem] max-[580px]:tracking-[-1px] max-[380px]:text-[1.9rem]">
          Deepak
          <br />
          Chandwani
        </h1>

        {/* Role */}
        <p className="text-[clamp(0.88rem,1.3vw,1rem)] text-cyan-2 font-semibold tracking-[0.5px] mb-4">
          AI Consultant &amp; Strategist
        </p>

        {/* Description */}
        <p className="text-[0.88rem] text-muted leading-[1.78] mb-9 max-w-[360px]">
          Helping businesses design, build, and scale intelligent solutions that
          create real-world impact.
        </p>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap mb-12 max-[580px]:flex-col">
          <a
            href="#services"
            className="py-3 px-6 bg-cyan-2 text-white rounded-[10px] font-bold text-[0.85rem] no-underline transition-all hover:bg-cyan hover:shadow-[0_6px_20px_rgba(6,182,212,0.4)] whitespace-nowrap"
          >
            Explore Services &rarr;
          </a>
          <a
            href="/transcript"
            className="py-3 px-5 bg-white text-body border-[1.5px] border-bdl rounded-[10px] font-semibold text-[0.85rem] no-underline transition-all hover:border-cyan-2 hover:text-cyan-2 whitespace-nowrap"
          >
            &#9889; Transcript Tool
          </a>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-7 pt-9 border-t border-bdl max-md:gap-5 max-[580px]:gap-3.5">
          <div>
            <div className="font-syne text-[2rem] font-extrabold text-ink leading-none max-[580px]:text-[1.6rem]">
              50<sup className="text-cyan-2 text-[1.1rem] align-super">+</sup>
            </div>
            <div className="text-[0.62rem] uppercase tracking-[1.5px] text-faint mt-1">
              Projects
            </div>
          </div>
          <div className="w-px h-[38px] bg-bdl" />
          <div>
            <div className="font-syne text-[2rem] font-extrabold text-ink leading-none max-[580px]:text-[1.6rem]">
              10<sup className="text-cyan-2 text-[1.1rem] align-super">+</sup>
            </div>
            <div className="text-[0.62rem] uppercase tracking-[1.5px] text-faint mt-1">
              Years Exp.
            </div>
          </div>
          <div className="w-px h-[38px] bg-bdl" />
          <div>
            <div className="font-syne text-[2rem] font-extrabold text-ink leading-none max-[580px]:text-[1.6rem]">
              30<sup className="text-cyan-2 text-[1.1rem] align-super">+</sup>
            </div>
            <div className="text-[0.62rem] uppercase tracking-[1.5px] text-faint mt-1">
              Clients
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
