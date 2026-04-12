import { type ReactNode, Children, useRef, useEffect } from "react";

interface SlideContainerProps {
  current: number;
  children: ReactNode;
}

export function SlideContainer({ current, children }: SlideContainerProps) {
  const prevRef = useRef(current);
  const direction = current >= prevRef.current ? 1 : -1;

  useEffect(() => {
    prevRef.current = current;
  }, [current]);

  const slides = Children.toArray(children);

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ zIndex: 1 }}>
      {/* YouTube video background */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <iframe
          src="https://www.youtube.com/embed/880TBXMuzmk?autoplay=1&mute=1&loop=1&playlist=880TBXMuzmk&controls=0&showinfo=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&rel=0&playsinline=1&enablejsapi=1&start=30"
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute left-1/2 top-1/2 border-none opacity-35"
          style={{
            width: "180vw",
            height: "180vh",
            minWidth: "180vw",
            minHeight: "180vh",
            transform: "translate(-50%, -50%)",
            filter: "brightness(0.9) saturate(0.85)",
          }}
          title="Background video"
        />
      </div>
      {/* Overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 0, background: "rgba(15,23,42,0.2)" }}
      />

      {/* Slides */}
      {slides.map((child, idx) => {
        const isActive = idx === current;
        const isExitLeft = !isActive && idx < current;
        const isExitRight = !isActive && idx > current;

        let transformClass = "";
        if (isActive) {
          transformClass = "opacity-100 translate-x-0 scale-100";
        } else if (isExitLeft) {
          transformClass = "opacity-0 -translate-x-20 scale-[0.98]";
        } else if (isExitRight) {
          transformClass = "opacity-0 translate-x-20 scale-[0.98]";
        } else {
          // far away slides - hide based on direction
          transformClass =
            direction > 0
              ? "opacity-0 translate-x-20 scale-[0.98]"
              : "opacity-0 -translate-x-20 scale-[0.98]";
        }

        return (
          <div
            key={idx}
            className={`absolute inset-0 flex items-center justify-center overflow-y-auto transition-all duration-650 ease-[cubic-bezier(0.4,0,0.2,1)] ${transformClass} ${isActive ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{
              padding: "4.2rem 5.5rem 2rem",
              zIndex: isActive ? 2 : 1,
            }}
          >
            <div className="relative z-[2] w-full max-w-[1020px]">{child}</div>
          </div>
        );
      })}
    </div>
  );
}
