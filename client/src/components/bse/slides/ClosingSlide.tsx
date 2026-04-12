export function ClosingSlide() {
  return (
    <div className="text-center">
      <div className="mb-8 rounded-2xl border border-slate-300/20 bg-light/60 p-10 shadow-md backdrop-blur-xl">
        <div className="mb-2 font-space text-[clamp(2rem,4.5vw,3.2rem)] font-bold tracking-tight text-ink">
          BHARAT{" "}
          <span className="bg-gradient-to-br from-amber via-red to-pink-700 bg-clip-text text-transparent">
            SKILLS EXCHANGE
          </span>
        </div>
        <div
          className="mb-2 font-space font-bold text-ink"
          style={{
            fontSize: "clamp(2.8rem, 6.5vw, 4.5rem)",
            textShadow: "0 2px 12px rgba(255,255,255,0.8)",
          }}
        >
          Thank You
        </div>
        <div
          className="mb-10 text-lg font-semibold tracking-wide text-body"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          Next review in 2-3 weeks &nbsp;|&nbsp; Target: Very good shape
        </div>
      </div>

      <div className="quote-block mx-auto mb-8 max-w-[560px] rounded-r-2xl border-l-4 border-l-cyan-2 bg-white/[0.88] px-9 py-7 text-left shadow-lg backdrop-blur-[20px]">
        <p className="text-xl font-bold italic leading-relaxed text-ink">
          &ldquo;A month is a year in AI &mdash; we will be ahead of all
          others.&rdquo;
        </p>
      </div>

      <div className="mx-auto flex max-w-[560px] flex-col gap-3 text-left">
        {[
          "Immediate next step: 15-20 minute workshops to align on full platform concept",
          "Document repository setup within 1 week",
          "Advisory board formalization within 2-3 weeks",
        ].map((item, i) => (
          <div
            key={i}
            className="cs-item flex items-center gap-3.5 rounded-xl border border-bdl/30 bg-slate-50/85 px-5 py-4 text-base font-medium text-ink shadow-lg backdrop-blur-[14px]"
          >
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-2 to-indigo" />
            {item}
          </div>
        ))}
      </div>

      <div className="mt-10 inline-block rounded-lg border border-amber/25 bg-light/80 px-5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[3px] text-amber">
        Confidential &nbsp;|&nbsp; 29 March 2026
      </div>
    </div>
  );
}
