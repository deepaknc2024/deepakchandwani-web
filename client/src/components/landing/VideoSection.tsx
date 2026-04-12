import { useFadeIn } from "@/hooks/useFadeIn";

export default function VideoSection() {
  const headFade = useFadeIn();
  const frameFade = useFadeIn();

  return (
    <section
      id="ai-video"
      className="bg-light-2 py-28 px-8 max-[900px]:py-20 max-[580px]:py-16 max-[580px]:px-5"
    >
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div
          ref={headFade.ref}
          className={`text-center mb-12 max-[580px]:mb-8 transition-all duration-[650ms] ease-out ${
            headFade.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="text-[0.66rem] font-bold tracking-[2.5px] uppercase text-cyan-2 mb-3">
            AI in Action
          </div>
          <h2 className="font-syne text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-[-1px] text-ink mb-2">
            The Future of AI, Today
          </h2>
          <p className="text-muted text-[0.95rem]">
            Watch how Artificial Intelligence is transforming industries and
            reshaping the way we work.
          </p>
        </div>

        {/* Video frame */}
        <div
          ref={frameFade.ref}
          className={`rounded-[14px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.16)] transition-all duration-[650ms] ease-out ${
            frameFade.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-[22px]"
          }`}
        >
          <iframe
            className="w-full aspect-video block border-none"
            src="https://www.youtube.com/embed/RzkD_rTEBYs?autoplay=0&mute=1&loop=1&playlist=RzkD_rTEBYs&controls=1&rel=0&modestbranding=1"
            title="The Age of AI"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
