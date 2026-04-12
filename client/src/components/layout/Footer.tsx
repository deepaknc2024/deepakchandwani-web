import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-ink py-10 px-8 text-center border-t border-bdl">
      <div className="font-syne text-[1.3rem] font-extrabold text-white tracking-[-1px] mb-1.5">
        D<span className="text-cyan">C</span>
      </div>
      <p className="text-white/20 text-[0.78rem]">
        {t.footer.copyright}
      </p>
    </footer>
  );
}
