interface SideArrowsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function SideArrows({
  current,
  total,
  onPrev,
  onNext,
}: SideArrowsProps) {
  return (
    <>
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="fixed left-5 top-1/2 z-[500] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-slate-500/40 font-dm text-xl text-light-2 shadow-md backdrop-blur-xl transition-all duration-300 enabled:cursor-pointer enabled:hover:scale-[1.08] enabled:hover:border-cyan-2 enabled:hover:bg-cyan-2 enabled:hover:text-white enabled:hover:shadow-lg disabled:cursor-default disabled:opacity-25 max-lg:left-2.5 max-lg:h-10 max-lg:w-10 max-lg:text-base max-sm:left-1 max-sm:h-[34px] max-sm:w-[34px] max-sm:text-sm"
        style={{ background: "rgba(30,41,59,0.75)" }}
      >
        &#8249;
      </button>
      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="fixed right-5 top-1/2 z-[500] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-slate-500/40 font-dm text-xl text-light-2 shadow-md backdrop-blur-xl transition-all duration-300 enabled:cursor-pointer enabled:hover:scale-[1.08] enabled:hover:border-cyan-2 enabled:hover:bg-cyan-2 enabled:hover:text-white enabled:hover:shadow-lg disabled:cursor-default disabled:opacity-25 max-lg:right-2.5 max-lg:h-10 max-lg:w-10 max-lg:text-base max-sm:right-1 max-sm:h-[34px] max-sm:w-[34px] max-sm:text-sm"
        style={{ background: "rgba(30,41,59,0.75)" }}
      >
        &#8250;
      </button>
    </>
  );
}
