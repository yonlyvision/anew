import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";

import { getStaffStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    try {
      const status = await getStaffStatus();
      if (!status.isStaff) throw redirect({ to: "/dashboard" });
      return { staff: status };
    } catch (e) {
      if ((e as any)?.isRedirect) throw e;
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

const adminNav: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/moderation", label: "Moderation" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/contact", label: "Inbox" },
  { to: "/admin/audit", label: "Audit" },
  { to: "/admin/blog", label: "Journal" },
  { to: "/admin/stories", label: "Stories" },
];

function AdminLayout() {
  return (
    <div className="border-t border-ink/5">
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">
            Admin console
          </span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.25em] text-ink/50">
            {adminNav.map((l) => (
              <Link
                key={l.to}
                to={l.to as any}
                activeOptions={{ exact: l.exact ?? false }}
                className="hover:text-ink transition-colors"
                activeProps={{ className: "text-ink" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
