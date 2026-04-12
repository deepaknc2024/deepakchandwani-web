import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages, type Lang } from '@/i18n';

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg border border-bdl bg-white px-2.5 py-1.5 text-[0.78rem] font-medium text-muted hover:border-cyan-2 hover:text-cyan-2 transition-colors cursor-pointer"
        type="button"
        aria-label="Select language"
      >
        <span className="text-[0.9em]">{'\uD83C\uDF10'}</span>
        <span>{languages[lang].nativeLabel}</span>
        <span className="text-[0.65em] ml-0.5">{'\u25BE'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 min-w-[140px] rounded-xl border border-bdl bg-white py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-310">
          {(Object.keys(languages) as Lang[]).map((code) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              className={`w-full text-left px-4 py-1.5 text-[0.82rem] font-medium transition-colors bg-transparent border-none cursor-pointer ${
                code === lang
                  ? 'text-cyan-2 bg-cyan-2/5'
                  : 'text-muted hover:bg-light-2 hover:text-ink'
              }`}
            >
              {languages[code].nativeLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
