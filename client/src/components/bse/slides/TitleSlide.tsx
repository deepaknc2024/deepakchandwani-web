export function TitleSlide() {
  return (
    <div className="text-center">
      <div className="mb-8 rounded-2xl border border-slate-300/20 bg-light/60 p-10 shadow-md backdrop-blur-xl">
        <div
          className="mb-2 font-space font-bold tracking-[-2.5px] text-ink"
          style={{ fontSize: "clamp(2.8rem, 6.5vw, 4.8rem)" }}
        >
          BHARAT{" "}
          <span className="bg-gradient-to-br from-amber via-red to-pink-700 bg-clip-text text-transparent">
            SKILLS EXCHANGE
          </span>
        </div>
        <div
          className="mb-1 font-semibold text-ink"
          style={{
            fontSize: "clamp(1.3rem, 2.6vw, 1.85rem)",
            textShadow: "0 1px 8px rgba(255,255,255,0.9)",
          }}
        >
          Founders Meeting Notes
        </div>
        <div
          className="mb-12 text-lg font-semibold tracking-widest text-body"
          style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}
        >
          Detailed Synopsis &nbsp;|&nbsp; 29 March 2026
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-7 max-sm:flex-col max-sm:items-center max-sm:gap-3">
        {[
          {
            label: "Participants",
            value: (
              <>
                4 Founders including Madam,
                <br />
                Raman, Deepak &amp; others
              </>
            ),
          },
          {
            label: "Duration",
            value: (
              <>
                Full strategy session
                <br />
                recorded via WhatsApp
              </>
            ),
          },
          {
            label: "Focus Areas",
            value: (
              <>
                Mission, Technology, Sustainability,
                <br />
                Advisory Board &amp; Launch Strategy
              </>
            ),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="meta-card min-w-[200px] rounded-2xl border border-bdl/30 bg-light/85 px-9 py-6 text-center shadow-lg backdrop-blur-[14px] max-sm:min-w-0 max-sm:w-full max-sm:px-5 max-sm:py-4"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-[2.5px] text-cyan-2">
              {card.label}
            </div>
            <div className="text-base font-medium leading-relaxed text-ink">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 inline-block rounded-lg border border-amber/25 bg-light/80 px-5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[3px] text-amber">
        Confidential
      </div>
    </div>
  );
}
