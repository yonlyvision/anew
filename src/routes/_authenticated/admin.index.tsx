import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useAdminStats } from "@/components/admin/AdminNav";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — Anew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useAdminStats();

  const stats: Array<{
    label: string;
    value: number | string;
    to?: string;
    highlight?: boolean;
  }> = [
    { label: "Members", value: data?.members ?? "—" },
    { label: "Paused", value: data?.pausedMembers ?? "—" },
    {
      label: "Applications pending",
      value: data?.pendingApplications ?? "—",
      to: "/admin/applications",
      highlight: (data?.pendingApplications ?? 0) > 0,
    },
    {
      label: "Verifications pending",
      value: data?.pendingVerifications ?? "—",
      to: "/admin/verifications",
      highlight: (data?.pendingVerifications ?? 0) > 0,
    },
    {
      label: "Open reports",
      value: data?.openReports ?? "—",
      to: "/admin/reports",
      highlight: (data?.openReports ?? 0) > 0,
    },
    {
      label: "Unhandled inbox",
      value: data?.unhandledContact ?? "—",
      to: "/admin/contact",
      highlight: (data?.unhandledContact ?? 0) > 0,
    },
    { label: "Matches", value: data?.matchesTotal ?? "—" },
    { label: "Messages · 24h", value: data?.messages24h ?? "—" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Overview</h1>
      <p className="mt-3 max-w-xl text-sm text-ink/60">
        Live snapshot of the community. Counts refresh automatically every 20 seconds.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <div
              className={`relative h-full overflow-hidden rounded-2xl border p-6 shadow-sm transition-all md:p-7 ${
                s.highlight
                  ? "border-accent/30 bg-gradient-to-br from-accent/[0.1] to-paper ring-2 ring-accent/15"
                  : "border-ink/10 bg-paper hover:shadow-md"
              }`}
            >
              {s.highlight && (
                <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
              )}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
                {s.label}
              </p>
              <p className={`mt-3 font-serif text-4xl ${s.highlight ? "text-accent" : ""}`}>
                {isLoading ? "·" : s.value}
              </p>
            </div>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="block hover:-translate-y-0.5 transition-transform">
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
