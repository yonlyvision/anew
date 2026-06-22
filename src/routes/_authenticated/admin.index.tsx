import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getAdminStats } from "@/lib/admin.functions";

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
  const fn = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fn(),
  });

  const stats: Array<{ label: string; value: number | string; to?: string }> = [
    { label: "Members", value: data?.members ?? "—" },
    { label: "Paused", value: data?.pausedMembers ?? "—" },
    {
      label: "Applications pending",
      value: data?.pendingApplications ?? "—",
      to: "/admin/applications",
    },
    {
      label: "Verifications pending",
      value: data?.pendingVerifications ?? "—",
      to: "/admin/verifications",
    },
    { label: "Open reports", value: data?.openReports ?? "—", to: "/admin/reports" },
    { label: "Unhandled inbox", value: data?.unhandledContact ?? "—", to: "/admin/contact" },
    { label: "Matches", value: data?.matchesTotal ?? "—" },
    { label: "Messages · 24h", value: data?.messages24h ?? "—" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Overview</h1>
      <p className="mt-3 text-ink/60 max-w-xl">
        A quiet snapshot of the community. Numbers refresh as you work.
      </p>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 border border-ink/10">
        {stats.map((s) => {
          const inner = (
            <div className="bg-paper p-6 md:p-8 h-full">
              <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">
                {s.label}
              </p>
              <p className="mt-3 font-serif text-4xl">
                {isLoading ? "·" : s.value}
              </p>
            </div>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="block hover:bg-ink/[0.02] transition-colors">
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
