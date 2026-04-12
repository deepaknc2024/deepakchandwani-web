import { useState, useCallback, useEffect, useRef } from "react";

interface UseSlideshowReturn {
  current: number;
  total: number;
  isAutoplaying: boolean;
  goTo: (idx: number) => void;
  next: () => void;
  prev: () => void;
  startAutoplay: () => void;
  stopAutoplay: () => void;
  restart: () => void;
}

export function useSlideshow(total: number): UseSlideshowReturn {
  const [current, setCurrent] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= total || idx === currentRef.current) return;
      setCurrent(idx);
    },
    [total],
  );

  const next = useCallback(() => {
    goTo(currentRef.current + 1);
  }, [goTo]);

  const prev = useCallback(() => {
    goTo(currentRef.current - 1);
  }, [goTo]);

  const stopAutoplay = useCallback(() => {
    setIsAutoplaying(false);
    clearTimer();
  }, [clearTimer]);

  const scheduleNext = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      const nextIdx =
        currentRef.current < total - 1 ? currentRef.current + 1 : 0;
      setCurrent(nextIdx);
    }, 6000);
  }, [total, clearTimer]);

  const startAutoplay = useCallback(() => {
    setIsAutoplaying(true);
  }, []);

  const restart = useCallback(() => {
    stopAutoplay();
    setCurrent(0);
  }, [stopAutoplay]);

  // Schedule next slide when autoplaying and current changes
  useEffect(() => {
    if (isAutoplaying) {
      scheduleNext();
    }
    return clearTimer;
  }, [isAutoplaying, current, scheduleNext, clearTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          stopAutoplay();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stopAutoplay();
          prev();
          break;
        case "Home":
          e.preventDefault();
          stopAutoplay();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          stopAutoplay();
          goTo(total - 1);
          break;
        case " ":
          e.preventDefault();
          setIsAutoplaying((a) => !a);
          break;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [next, prev, goTo, stopAutoplay, total]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = startX - e.changedTouches[0].screenX;
      const dy = startY - e.changedTouches[0].screenY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        stopAutoplay();
        if (dx > 0) next();
        else prev();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [next, prev, stopAutoplay]);

  return {
    current,
    total,
    isAutoplaying,
    goTo,
    next,
    prev,
    startAutoplay,
    stopAutoplay,
    restart,
  };
}
