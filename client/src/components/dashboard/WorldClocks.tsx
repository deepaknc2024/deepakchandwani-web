import { useClocks } from "@/hooks/useClocks";

function ClockCard({
  flag,
  city,
  tz,
  data,
}: {
  flag: string;
  city: string;
  tz: string;
  data: { hm: string; sec: string; ampm: string; date: string };
}) {
  return (
    <div className="rounded-xl border border-bdl bg-white p-3 text-center">
      <div className="mb-1 text-xs font-bold text-body">
        {flag} {city}
        <span className="block text-[0.6rem] font-normal text-faint">{tz}</span>
      </div>
      <div className="flex items-baseline justify-center gap-0.5">
        <span className="font-syne text-xl font-extrabold tracking-tight text-ink tabular-nums leading-none">
          {data.hm}
        </span>
        <span className="text-xs font-semibold text-faint tabular-nums">
          {data.sec}
        </span>
      </div>
      <div className="mt-0.5 text-[0.62rem] font-bold tracking-wide text-cyan-2">
        {data.ampm}
      </div>
      <div className="mt-0.5 text-[0.62rem] text-muted">{data.date}</div>
    </div>
  );
}

export default function WorldClocks() {
  const clocks = useClocks();

  return (
    <div className="grid grid-cols-2 gap-2">
      <ClockCard
        flag={"\ud83c\uddee\ud83c\uddf3"}
        city="India"
        tz="IST"
        data={clocks.india}
      />
      <ClockCard
        flag={"\ud83c\uddfa\ud83c\uddf8"}
        city="New York"
        tz="ET"
        data={clocks.newYork}
      />
    </div>
  );
}
