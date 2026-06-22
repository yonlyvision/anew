import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { NotificationsBell } from "@/components/site/NotificationsBell";
import { getStaffStatus } from "@/lib/admin.functions";
import { getAccountStatus } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
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

    return { userId: data.user.id };
  },
  component: AuthenticatedLayout,
});

const memberNav: Array<{ to: string; label: string; mobile?: boolean }> = [
  { to: "/dashboard", label: "Home", mobile: true },
  { to: "/discover", label: "Discover", mobile: true },
  { to: "/matches", label: "Matches", mobile: true },
  { to: "/messages", label: "Messages", mobile: true },
  { to: "/profile", label: "Profile", mobile: true },
  { to: "/search", label: "Search" },
  { to: "/likes", label: "Likes" },
  { to: "/notifications", label: "Inbox" },
  { to: "/settings", label: "Settings" },
];

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

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/dashboard"
            className="group flex items-center gap-2 font-serif text-2xl font-medium tracking-tight"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-accent transition-transform group-hover:scale-125" />
            Anew
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink/55">
            {memberNav.map((l) => (
              <Link
                key={l.to}
                to={l.to as "/dashboard"}
                className="rounded-full px-3 py-2 transition-colors hover:bg-ink/5 hover:text-ink"
                activeProps={{ className: "rounded-full px-3 py-2 bg-ink/5 text-ink" }}
              >
                {l.label}
              </Link>
            ))}
            {staff?.isStaff ? (
              <Link
                to="/admin"
                className="rounded-full px-3 py-2 text-accent/80 transition-colors hover:bg-accent/10"
                activeProps={{ className: "rounded-full px-3 py-2 bg-accent/10 text-accent" }}
              >
                Admin
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-4">
            <NotificationsBell />
            <button
              type="button"
              onClick={signOut}
              className="hidden md:inline rounded-full px-3 py-2 text-sm font-medium text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur-md md:hidden">
        <div className="flex items-stretch justify-around">
          {memberNav
            .filter((l) => l.mobile)
            .map((l) => (
              <Link
                key={l.to}
                to={l.to as "/dashboard"}
                className="flex flex-1 flex-col items-center py-3 text-[10px] uppercase tracking-wider text-ink/45"
                activeProps={{ className: "flex flex-1 flex-col items-center py-3 text-[10px] uppercase tracking-wider text-coral" }}
              >
                {l.label}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}
