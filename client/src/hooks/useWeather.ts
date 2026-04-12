import { useState, useEffect } from "react";

interface WeatherDay {
  name: string;
  high: number;
  low: number;
  icon: string;
  rainChance: number;
}

interface WeatherState {
  days: WeatherDay[];
  loading: boolean;
}

const WMO_ICON: Record<number, string> = {
  0: "\u2600\ufe0f",
  1: "\ud83c\udf24\ufe0f",
  2: "\u26c5",
  3: "\u2601\ufe0f",
  45: "\ud83c\udf2b\ufe0f",
  48: "\ud83c\udf2b\ufe0f",
  51: "\ud83c\udf26\ufe0f",
  53: "\ud83c\udf26\ufe0f",
  55: "\ud83c\udf27\ufe0f",
  61: "\ud83c\udf26\ufe0f",
  63: "\ud83c\udf27\ufe0f",
  65: "\ud83c\udf27\ufe0f",
  71: "\ud83c\udf28\ufe0f",
  73: "\ud83c\udf28\ufe0f",
  75: "\u2744\ufe0f",
  77: "\ud83c\udf28\ufe0f",
  80: "\ud83c\udf26\ufe0f",
  81: "\ud83c\udf27\ufe0f",
  82: "\u26c8\ufe0f",
  85: "\ud83c\udf28\ufe0f",
  86: "\u2744\ufe0f",
  95: "\u26c8\ufe0f",
  96: "\u26c8\ufe0f",
  99: "\u26c8\ufe0f",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function useWeather(): WeatherState {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/New_York&forecast_days=7&temperature_unit=fahrenheit",
          { signal: AbortSignal.timeout(9000) }
        );
        const data = await res.json();
        const result: WeatherDay[] = data.daily.time.map(
          (ds: string, i: number) => {
            const dt = new Date(ds + "T12:00:00");
            const code = data.daily.weathercode[i];
            return {
              name:
                i === 0
                  ? "Today"
                  : i === 1
                    ? "Tmrw"
                    : DAY_NAMES[dt.getDay()],
              high: Math.round(data.daily.temperature_2m_max[i]),
              low: Math.round(data.daily.temperature_2m_min[i]),
              icon: WMO_ICON[code] || "\ud83c\udf21\ufe0f",
              rainChance: data.daily.precipitation_probability_max[i],
            };
          }
        );
        setDays(result);
      } catch {
        // weather unavailable
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { days, loading };
}
