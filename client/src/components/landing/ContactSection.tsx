import { useFadeIn } from "@/hooks/useFadeIn";
import { useLanguage } from "@/contexts/LanguageContext";
import ContactForm from "./ContactForm";

export default function ContactSection() {
  const { t } = useLanguage();
  const leftFade = useFadeIn();
  const rightFade = useFadeIn();

  return (
    <section
      id="contact"
      className="py-28 px-8 bg-white max-[900px]:py-20 max-[580px]:py-16 max-[580px]:px-5"
    >
      <div className="max-w-[1140px] mx-auto grid grid-cols-[1fr_1.3fr] gap-24 items-start max-lg:grid-cols-1 max-lg:gap-12 max-md:gap-10">
        <div
          ref={leftFade.ref}
          className={`transition-all duration-[650ms] ease-out ${
            leftFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]"
          }`}
        >
          <div className="text-[0.66rem] font-bold tracking-[2.5px] uppercase text-cyan-2 mb-3">
            {t.contactSection.sectionLabel}
          </div>
          <h2 className="font-syne text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold tracking-[-1px] text-ink leading-[1.2] mb-4">
            {t.contactSection.heading}
          </h2>
          <p className="text-muted text-[0.95rem] leading-[1.8] mb-10">
            {t.contactSection.description}
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-[10px] border-[1.5px] border-bdl flex items-center justify-center text-[1.1rem] shrink-0">
                &#128231;
              </div>
              <div>
                <strong className="block text-[0.82rem] font-bold text-ink">{t.contactSection.emailLabel}</strong>
                <span className="text-[0.82rem] text-muted">{t.contactSection.emailValue}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-[10px] border-[1.5px] border-bdl flex items-center justify-center text-[1.1rem] shrink-0">
                &#127760;
              </div>
              <div>
                <strong className="block text-[0.82rem] font-bold text-ink">{t.contactSection.websiteLabel}</strong>
                <span className="text-[0.82rem] text-muted">{t.contactSection.websiteValue}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-[10px] border-[1.5px] border-bdl flex items-center justify-center text-[1.1rem] shrink-0">
                &#128205;
              </div>
              <div>
                <strong className="block text-[0.82rem] font-bold text-ink">{t.contactSection.basedInLabel}</strong>
                <span className="text-[0.82rem] text-muted">{t.contactSection.basedInValue}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={rightFade.ref}
          className={`transition-all duration-[650ms] ease-out ${
            rightFade.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]"
          }`}
        >
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
