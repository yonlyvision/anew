import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminAlerts, AdminNavLinks } from "@/components/admin/AdminNav";
import { FoundingInviteButton } from "@/components/admin/FoundingInviteButton";
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

function AdminLayout() {
  return (
    <div className="border-t border-ink/5 bg-[radial-gradient(circle_at_top_left,_rgba(229,98,84,0.06),_transparent_40%),linear-gradient(180deg,_rgba(255,247,241,0.5),_rgba(255,247,241,1))]">
      <AdminAlerts />
      <div className="mx-auto max-w-7xl px-6 pb-2 pt-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-paper shadow-md">
                A
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                  Admin console
                </p>
                <p className="text-xs text-ink/45">Live counts refresh every 20 seconds</p>
              </div>
            </div>
            <AdminNavLinks />
          </div>
          <FoundingInviteButton />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
