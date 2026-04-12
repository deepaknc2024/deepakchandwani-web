import { useState, useEffect, useCallback } from "react";

interface CurrencyState {
  rate: number | null;
  change: number | null;
  changePercent: number | null;
  loading: boolean;
  updatedAt: string | null;
  refresh: () => void;
}

export function useCurrency(): CurrencyState {
  const [rate, setRate] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      const currentRate = data.rates?.INR;
      if (!currentRate) throw new Error("No INR rate");

      setRate(currentRate);
      setUpdatedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      // Fetch yesterday's rate for change calculation
      try {
        const yd = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];
        const res2 = await fetch(
          `https://api.frankfurter.app/${yd}?from=USD&to=INR`,
          { signal: AbortSignal.timeout(6000) }
        );
        const data2 = await res2.json();
        const prev = data2?.rates?.INR;
        if (prev) {
          const diff = currentRate - prev;
          const pct = (diff / prev) * 100;
          setChange(diff);
          setChangePercent(pct);
        }
      } catch {
        // yesterday's rate unavailable
      }
    } catch {
      setRate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    const id = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchRate]);

  return { rate, change, changePercent, loading, updatedAt, refresh: fetchRate };
}
