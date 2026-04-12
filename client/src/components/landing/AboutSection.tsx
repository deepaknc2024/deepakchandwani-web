import { useFadeIn } from "@/hooks/useFadeIn";

export default function AboutSection() {
  const textFade = useFadeIn();
  const visualFade = useFadeIn();

  return (
    <section id="about" className="py-28 px-8 bg-white max-[900px]:py-20 max-[580px]:py-16 max-[580px]:px-5">
      <div className="max-w-[1140px] mx-auto grid grid-cols-[1.1fr_1fr] gap-24 items-center max-lg:grid-cols-1 max-lg:gap-12 max-md:gap-8">
        {/* Text column */}
        <div
          ref={textFade.ref}
          className={`transition-all duration-[650ms] ease-out ${
            textFade.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="text-[0.66rem] font-bold tracking-[2.5px] uppercase text-cyan-2 mb-3">
            Background
          </div>
          <h2 className="font-syne text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold tracking-[-1.2px] text-ink leading-[1.15] mb-6">
            Where AI Meets Real&#8209;World Execution
          </h2>
          <p className="text-muted text-[0.97rem] leading-[1.8] mb-4">
            Deepak Chandwani is an AI architect and technology strategist
            focused on large language models, agentic AI, and intelligent
            automation at enterprise scale.
          </p>
          <p className="text-muted text-[0.97rem] leading-[1.8] mb-4">
            His work spans the full AI lifecycle &mdash; from research and
            proof&#8209;of&#8209;concept through production deployment and MLOps
            &mdash; with deep hands-on experience in LLM fine-tuning,
            retrieval-augmented generation, multi-modal systems, and
            voice&nbsp;AI.
          </p>
          <p className="text-muted text-[0.97rem] leading-[1.8] mb-4">
            A practitioner at the intersection of cutting-edge research and
            practical engineering, with a focus on building AI systems that
            are reliable, scalable, and grounded in measurable outcomes.
          </p>
          <div className="flex gap-3 mt-8 flex-wrap">
            <a
              href="#expertise"
              className="py-3 px-6 bg-ink text-white rounded-md font-bold text-[0.85rem] no-underline transition-all hover:bg-dark-2 hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)]"
            >
              Areas of Focus &rarr;
            </a>
            <a
              href="#contact"
              className="py-3 px-5 border-[1.5px] border-bdl text-body rounded-md font-semibold text-[0.85rem] no-underline transition-all hover:border-cyan-2 hover:text-cyan-2"
            >
              Connect
            </a>
          </div>
        </div>

        {/* Visual column */}
        <div
          ref={visualFade.ref}
          className={`relative transition-all duration-[650ms] ease-out ${
            visualFade.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="bg-light-2 border border-bdl rounded-[20px] p-12 text-center relative overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.1)]">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-2 to-indigo" />

            {/* Avatar */}
            <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-cyan-2 to-indigo mx-auto mb-5 flex items-center justify-center text-[2.8rem] shadow-[0_8px_30px_rgba(6,182,212,0.25)]">
              &#128100;
            </div>
            <h3 className="font-syne text-[1.25rem] font-extrabold text-ink mb-1">
              Deepak Chandwani
            </h3>
            <p className="text-muted text-[0.85rem]">
              AI Architect &amp; Technology Strategist
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-6">
              {[
                { label: "LLM Engineering", hot: true },
                { label: "Agentic AI", hot: true },
                { label: "RAG & Retrieval", hot: false },
                { label: "Multi-modal AI", hot: false },
                { label: "Voice & Conversational AI", hot: true },
                { label: "MLOps & Deployment", hot: false },
                { label: "Prompt Engineering", hot: true },
                { label: "AI Product Architecture", hot: false },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className={`py-1 px-3 border rounded-lg text-[0.68rem] font-medium ${
                    tag.hot
                      ? "border-cyan-2/30 text-cyan-2 bg-cyan-2/[0.06]"
                      : "border-bdl text-muted"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-3.5 -right-4.5 bg-white rounded-[10px] py-2 px-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.1)] flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink animate-[bob_3s_ease-in-out_infinite] max-lg:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[0.85rem] bg-[#ecfdf5]">
              &#9989;
            </div>
            LLM Specialist
          </div>
          <div className="absolute bottom-4.5 -left-5.5 bg-white rounded-[10px] py-2 px-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.1)] flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink animate-[bob_3.5s_ease-in-out_infinite_0.5s] max-lg:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[0.85rem] bg-[#eff6ff]">
              &#129302;
            </div>
            AI Architect
          </div>
          <div className="absolute top-[40%] -right-7 bg-white rounded-[10px] py-2 px-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.1)] flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink animate-[bob_4s_ease-in-out_infinite_1s] max-lg:hidden">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[0.85rem] bg-[#fefce8]">
              &#11088;
            </div>
            GenAI Pioneer
          </div>
        </div>
      </div>
    </section>
  );
}
