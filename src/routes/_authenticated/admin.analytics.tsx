import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getAdminAnalytics } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Anew Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fn(),
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Analytics</h1>
      <p className="mt-3 text-ink/60">Last 30 days, server time.</p>

      {isLoading && <p className="mt-10 text-sm text-ink/50">Loading…</p>}

      {data && (
        <>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="New members" value={data.totals.signups} />
            <Stat label="Likes" value={data.totals.likes} />
            <Stat label="Matches" value={data.totals.matches} />
            <Stat label="Messages" value={data.totals.messages} />
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <Chart title="Signups / day" series={data.signups} color="#c89b3c" />
            <Chart title="Likes / day" series={data.likes} color="#7a5cff" />
            <Chart title="Matches / day" series={data.matches} color="#3c8a5c" />
            <Chart title="Messages / day" series={data.messages} color="#1f1f1f" />
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink/10 p-5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

function Chart({
  title,
  series,
  color,
}: {
  title: string;
  series: Array<{ d: string; n: number }>;
  color: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.n));
  const w = 600;
  const h = 140;
  const step = w / Math.max(1, series.length - 1);
  const points = series
    .map((s, i) => `${i * step},${h - (s.n / max) * (h - 20) - 5}`)
    .join(" ");
  const area = `0,${h} ${points} ${w},${h}`;

  return (
    <div className="border border-ink/10 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink/60">{title}</p>
        <p className="text-xs text-ink/40">max {max}</p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-32">
        <polygon points={area} fill={color} opacity={0.12} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-ink/40">
        <span>{series[0]?.d.slice(5)}</span>
        <span>{series[series.length - 1]?.d.slice(5)}</span>
      </div>
    </div>
  );
}
