import { useState, useEffect } from "react";

interface ClockData {
  hm: string;
  sec: string;
  ampm: string;
  date: string;
}

interface ClocksState {
  india: ClockData;
  newYork: ClockData;
  dashTime: string;
}

function formatTZ(tz: string): ClockData {
  const t = new Date(
    new Date().toLocaleString("en-US", { timeZone: tz })
  );
  let h = t.getHours();
  const m = t.getMinutes();
  const s = t.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    hm: `${p(h)}:${p(m)}`,
    sec: `:${p(s)}`,
    ampm,
    date: t.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}

export function useClocks(): ClocksState {
  const [state, setState] = useState<ClocksState>(() => tick());

  function tick(): ClocksState {
    const now = new Date();
    return {
      india: formatTZ("Asia/Kolkata"),
      newYork: formatTZ("America/New_York"),
      dashTime:
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " \u00b7 " +
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
    };
  }

  useEffect(() => {
    const id = setInterval(() => setState(tick()), 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
