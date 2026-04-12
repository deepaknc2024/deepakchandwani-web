import { type ReactNode, useEffect, useRef } from "react";

interface SlideProps {
  slideNumber?: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  children: ReactNode;
}

export function Slide({
  slideNumber,
  title,
  subtitle,
  isActive,
  children,
}: SlideProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !bodyRef.current) return;

    const els = bodyRef.current.querySelectorAll<HTMLElement>(
      ".tri-card, .quad-card, .col-card, .sus-card, .meta-card, .bullet-item, .decision-item, .action-row, .cs-item, .quote-block, .usp-banner, .content-text, .anim-child",
    );

    els.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "none";
      setTimeout(() => {
        el.style.transition =
          "opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 50 + i * 45);
    });
  }, [isActive]);

  return (
    <div>
      {(slideNumber || title) && (
        <div className="mb-10 rounded-2xl border-l-4 border-l-cyan-2 bg-slate-50/85 px-9 py-7 shadow-md backdrop-blur-[14px]">
          {slideNumber && (
            <div className="mb-2 text-sm font-bold uppercase tracking-[3px] text-cyan-2">
              {slideNumber}
            </div>
          )}
          {title && (
            <div className="font-space text-[clamp(2rem,4.2vw,3.2rem)] font-bold leading-tight tracking-tight text-ink">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="mt-1 text-lg font-semibold text-body">
              {subtitle}
            </div>
          )}
        </div>
      )}
      <div ref={bodyRef} className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
