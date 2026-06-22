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

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Welcome</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
        Hello, {profile?.first_name || "friend"}.
      </h1>
      <p className="mt-6 max-w-xl text-ink/70 leading-relaxed">
        Anew is a quiet place. Take your time. Be honest. Look at people the way
        you would want to be looked at.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Card title="Profile completion" value={`${profile?.profile_completion ?? 0}%`} link={{ to: "/onboarding", label: "Continue" }} />
        <Card title="Verification" value={profile?.email_verified ? "Email verified" : "Not yet"} link={{ to: "/profile", label: "View status" }} />
        <Card title="New likes" value="—" link={{ to: "/likes", label: "View likes" }} />
      </div>

      <div className="mt-16 border-t border-ink/10 pt-10">
        <h2 className="font-serif text-2xl">Coming next</h2>
        <p className="mt-4 max-w-xl text-sm text-ink/60 leading-relaxed">
          Discovery, likes, matches and messages are next. Your foundation —
          account, profile and safety — is in place.
        </p>
      </div>
    </section>
  );
}

function Card({ title, value, link }: { title: string; value: string; link: { to: string; label: string } }) {
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
