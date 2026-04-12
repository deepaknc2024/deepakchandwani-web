import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[calc(100vh-58px)] flex flex-col items-center justify-center px-8 py-20">
      <h1 className="font-syne text-[clamp(4rem,8vw,6rem)] font-extrabold text-ink tracking-[-3px] leading-none mb-4">
        {t.notFound.title}
      </h1>
      <p className="text-muted text-[1.1rem] mb-8 text-center">
        {t.notFound.message}
      </p>
      <Link
        to="/"
        className="py-3 px-6 bg-cyan-2 text-white rounded-[10px] font-bold text-[0.85rem] no-underline transition-all hover:bg-cyan hover:shadow-[0_6px_20px_rgba(6,182,212,0.4)]"
      >
        &larr; {t.notFound.backHome}
      </Link>
    </div>
  );
}
