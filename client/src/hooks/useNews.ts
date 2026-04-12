import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/types";

interface NewsState {
  usItems: NewsItem[];
  inItems: NewsItem[];
  loading: boolean;
}

export function useNews(): NewsState {
  const [usItems, setUsItems] = useState<NewsItem[]>([]);
  const [inItems, setInItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegion = useCallback(
    async (region: string): Promise<NewsItem[]> => {
      try {
        const res = await fetch(`/api/news?region=${region}`, {
          signal: AbortSignal.timeout(12000),
        });
        const data = await res.json();
        if (!data.ok || !data.items?.length) return [];
        return data.items;
      } catch {
        return [];
      }
    },
    []
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [us, india] = await Promise.all([
        fetchRegion("us"),
        fetchRegion("in"),
      ]);
      setUsItems(us);
      setInItems(india);
      setLoading(false);
    }
    load();
  }, [fetchRegion]);

  return { usItems, inItems, loading };
}
