import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { getAdminStats } from "@/lib/admin.functions";

type BadgeKey =
  | "pendingApplications"
  | "pendingVerifications"
  | "openReports"
  | "unhandledContact";

const adminNav: Array<{
  to: string;
  label: string;
  exact?: boolean;
  badge?: BadgeKey;
}> = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/applications", label: "Applications", badge: "pendingApplications" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/verifications", label: "Verifications", badge: "pendingVerifications" },
  { to: "/admin/reports", label: "Reports", badge: "openReports" },
  { to: "/admin/moderation", label: "Moderation" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/contact", label: "Inbox", badge: "unhandledContact" },
  { to: "/admin/audit", label: "Audit" },
  { to: "/admin/blog", label: "Journal" },
  { to: "/admin/stories", label: "Stories" },
];

export function useAdminStats() {
  const fn = useServerFn(getAdminStats);
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fn(),
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
  });
}

export function AdminAlerts() {
  const { data } = useAdminStats();
  const prevRef = useRef<{
    pendingApplications?: number;
    unhandledContact?: number;
    pendingVerifications?: number;
    openReports?: number;
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    const prev = prevRef.current;
    if (prev) {
      if ((data.pendingApplications ?? 0) > (prev.pendingApplications ?? 0)) {
        const delta = (data.pendingApplications ?? 0) - (prev.pendingApplications ?? 0);
        toast.info(
          delta === 1
            ? "New application waiting for review"
            : `${delta} new applications waiting for review`,
          { action: { label: "Review", onClick: () => { window.location.href = "/admin/applications"; } } }
        );
      }
      if ((data.unhandledContact ?? 0) > (prev.unhandledContact ?? 0)) {
        toast.info("New message in contact inbox", {
          action: { label: "Open inbox", onClick: () => { window.location.href = "/admin/contact"; } },
        });
      }
    }
    prevRef.current = {
      pendingApplications: data.pendingApplications,
      unhandledContact: data.unhandledContact,
      pendingVerifications: data.pendingVerifications,
      openReports: data.openReports,
    };
  }, [data]);

  const pendingApps = data?.pendingApplications ?? 0;
  const inbox = data?.unhandledContact ?? 0;
  const verifications = data?.pendingVerifications ?? 0;
  const reports = data?.openReports ?? 0;
  const total = pendingApps + inbox + verifications + reports;

  if (total === 0) return null;

  const items: Array<{ label: string; count: number; to: string }> = [];
  if (pendingApps > 0) {
    items.push({ label: pendingApps === 1 ? "application" : "applications", count: pendingApps, to: "/admin/applications" });
  }
  if (inbox > 0) {
    items.push({ label: inbox === 1 ? "inbox message" : "inbox messages", count: inbox, to: "/admin/contact" });
  }
  if (verifications > 0) {
    items.push({
      label: verifications === 1 ? "verification" : "verifications",
      count: verifications,
      to: "/admin/verifications",
    });
  }
  if (reports > 0) {
    items.push({ label: reports === 1 ? "report" : "reports", count: reports, to: "/admin/reports" });
  }

  return (
    <div className="border-b border-accent/20 bg-gradient-to-r from-accent/[0.12] via-accent/[0.06] to-teal/[0.08]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          Needs your attention
        </span>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-sm font-medium text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
            >
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-paper">
                {item.count}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminNavLinks() {
  const { data } = useAdminStats();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {adminNav.map((l) => {
        const count = l.badge && data ? (data[l.badge] as number) : 0;
        return (
          <Link
            key={l.to}
            to={l.to as any}
            activeOptions={{ exact: l.exact ?? false }}
            className="relative inline-flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50 transition-all hover:border-ink/10 hover:bg-paper hover:text-ink hover:shadow-sm"
            activeProps={{
              className:
                "relative inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink shadow-sm",
            }}
          >
            {l.label}
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-paper">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
