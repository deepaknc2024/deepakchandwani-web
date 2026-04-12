import { useEffect, useRef, useState } from "react";

interface StatProps {
  end: number;
  suffix: string;
  label: string;
}

function AnimatedStat({ end, suffix, label }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    const step = 16;
    const steps = duration / step;
    let current = 0;
    const increment = end / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, step);

    return () => clearInterval(timer);
  }, [started, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-syne text-[clamp(2.2rem,4vw,3.2rem)] font-extrabold text-ink leading-none">
        {count}
        <sup className="text-cyan-2 text-[0.6em] align-super">{suffix}</sup>
      </div>
      <div className="text-[0.68rem] text-muted uppercase tracking-[1.5px] mt-2">
        {label}
      </div>
    </div>
  );
}

export default function StatsBand() {
  return (
    <div className="bg-light-2 py-14 px-8 border-t border-b border-bdl max-[580px]:py-10 max-[580px]:px-5">
      <div className="max-w-[1000px] mx-auto grid grid-cols-4 gap-8 text-center max-[900px]:grid-cols-2 max-[580px]:grid-cols-2">
        <AnimatedStat end={50} suffix="+" label="AI Projects Delivered" />
        <AnimatedStat end={10} suffix="+" label="Years of Experience" />
        <AnimatedStat end={30} suffix="+" label="Happy Clients" />
        <AnimatedStat end={100} suffix="%" label="Client Satisfaction" />
      </div>
    </div>
  );
}
