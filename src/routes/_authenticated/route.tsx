import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { NotificationsBell } from "@/components/site/NotificationsBell";
import { getStaffStatus } from "@/lib/admin.functions";
import { isMemberDatingPath, memberNav, staffNav } from "@/lib/member-nav";
import { getAccountStatus } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    const mustChangePassword =
      (data.user.user_metadata as { must_change_password?: boolean } | null)
        ?.must_change_password === true;
    if (mustChangePassword && location.pathname !== "/change-password") {
      throw redirect({ to: "/change-password" });
    }

    try {
      const status = await getAccountStatus();
      if (status.isBanned) {
        await supabase.auth.signOut();
        throw redirect({ to: "/auth", search: { redirect: location.href } });
      }
    } catch (e) {
      if ((e as { isRedirect?: boolean }).isRedirect) throw e;
    }

    try {
      const staff = await getStaffStatus();
      if (staff.isStaff && isMemberDatingPath(location.pathname)) {
        throw redirect({ to: "/admin" });
      }
    } catch (e) {
      if ((e as { isRedirect?: boolean }).isRedirect) throw e;
    }

    return { userId: data.user.id };
  },
  component: AuthenticatedLayout,
});

const shellBg =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(229,98,84,0.07),_transparent_38%),radial-gradient(circle_at_88%_8%,_rgba(46,138,146,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,247,241,0.6),_rgba(255,247,241,1))] text-ink font-sans";

function AuthenticatedLayout() {
  const staffFn = useServerFn(getStaffStatus);
  const { data: staff } = useQuery({
    queryKey: ["me", "staff"],
    queryFn: () => staffFn(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session && typeof window !== "undefined") {
        window.location.assign("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.assign("/");
  }

  const isStaff = staff?.isStaff === true;

  return (
    <div className={`${shellBg} ${isStaff ? "pb-0" : "pb-20 md:pb-0"}`}>
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-paper/85 shadow-[0_8px_30px_-20px_rgba(32,23,20,0.25)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link
            to={isStaff ? "/admin" : "/dashboard"}
            className="group flex items-center gap-2.5 font-serif text-2xl font-medium tracking-tight"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-xs font-bold text-paper shadow-md transition-transform group-hover:scale-105">
              A
            </span>
            Anew
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            {isStaff
              ? staffNav.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to as "/admin"}
                    className="rounded-full border border-transparent px-3.5 py-2 text-ink/55 transition-all hover:border-ink/10 hover:bg-paper hover:text-ink hover:shadow-sm"
                    activeProps={{
                      className:
                        "rounded-full border border-ink/12 bg-paper px-3.5 py-2 text-ink shadow-sm",
                    }}
                  >
                    {l.label}
                  </Link>
                ))
              : memberNav.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to as "/dashboard"}
                    className="rounded-full border border-transparent px-3.5 py-2 text-ink/55 transition-all hover:border-ink/10 hover:bg-paper hover:text-ink hover:shadow-sm"
                    activeProps={{
                      className:
                        "rounded-full border border-ink/12 bg-paper px-3.5 py-2 text-ink shadow-sm",
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
          </nav>

          <div className="flex items-center gap-3">
            {!isStaff && <NotificationsBell />}
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-ink/12 bg-paper px-4 py-2 text-sm font-medium text-ink/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:text-ink hover:shadow-md"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>

      {!isStaff && (
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-ink/10 bg-paper/95 shadow-[0_-8px_30px_-18px_rgba(32,23,20,0.2)] backdrop-blur-md md:hidden">
          <div className="flex items-stretch justify-around px-1">
            {memberNav
              .filter((l) => l.mobile)
              .map((l) => (
                <Link
                  key={l.to}
                  to={l.to as "/dashboard"}
                  className="flex flex-1 flex-col items-center py-3 text-[10px] font-semibold uppercase tracking-wider text-ink/45"
                  activeProps={{
                    className:
                      "flex flex-1 flex-col items-center py-3 text-[10px] font-semibold uppercase tracking-wider text-accent",
                  }}
                >
                  {l.label}
                </Link>
              ))}
          </div>
        </nav>
      )}
    </div>
  );
}
