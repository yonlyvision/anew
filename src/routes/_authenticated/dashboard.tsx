import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — Anew" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Profile = {
  first_name: string | null;
  onboarding_completed: boolean | null;
  profile_completion: number | null;
  email_verified: boolean | null;
};

function Dashboard() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name,onboarding_completed,profile_completion,email_verified")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setProfile(data);
      setLoading(false);
      if (data && !data.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  const completion = profile?.profile_completion ?? 0;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Welcome</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
        Hello, {profile?.first_name || "friend"}.
      </h1>
      <p className="mt-6 max-w-xl text-ink/70 leading-relaxed">
        Take your time. Be honest. Look at people the way you would want to be looked at.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Card
          title="Profile"
          value={`${completion}% complete`}
          link={{
            to: completion >= 80 ? "/profile" : "/onboarding",
            label: completion >= 80 ? "View profile" : "Continue setup",
          }}
        />
        <Card
          title="Verification"
          value={profile?.email_verified ? "Email verified" : "Verify email"}
          link={{ to: "/verification", label: "Verification" }}
        />
        <Card title="Messages" value="Inbox" link={{ to: "/messages", label: "Open messages" }} />
      </div>

      <div className="mt-16 border-t border-ink/10 pt-10">
        <h2 className="font-serif text-2xl">Where to go next</h2>
        <p className="mt-4 max-w-xl text-sm text-ink/60 leading-relaxed">
          Browse members who share your values, send likes, and start conversations when you match.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink to="/discover">Discover</QuickLink>
          <QuickLink to="/likes">Likes</QuickLink>
          <QuickLink to="/matches">Matches</QuickLink>
          <QuickLink to="/messages">Messages</QuickLink>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  link,
}: {
  title: string;
  value: string;
  link: { to: string; label: string };
}) {
  return (
    <div className="border border-ink/10 p-6 space-y-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{title}</p>
      <p className="font-serif text-3xl">{value}</p>
      <Link to={link.to} className="text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink">
        {link.label} →
      </Link>
    </div>
  );
}

function QuickLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-ink/10 px-5 py-2.5 text-sm font-medium text-ink/70 hover:border-accent/30 hover:text-ink transition-colors"
    >
      {children}
    </Link>
  );
}
