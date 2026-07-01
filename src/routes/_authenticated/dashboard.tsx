import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ProfilePhotoUploadPanel } from "@/components/profile/ProfilePhotoUploadPanel";
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
  photos: string[] | null;
  primary_photo: string | null;
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
        .select("first_name,onboarding_completed,profile_completion,email_verified,photos,primary_photo")
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
  const hasPhoto = (profile?.photos?.length ?? 0) > 0 || !!profile?.primary_photo;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Welcome</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
        Hello, {profile?.first_name || "friend"}.
      </h1>
      <p className="mt-6 max-w-xl text-ink/70 leading-relaxed">
        Take your time. Be honest. Look at people the way you would want to be looked at.
      </p>

      {!hasPhoto && (
        <div className="mt-10 rounded-[1.5rem] border border-ink/10 bg-paper/80 p-6 shadow-sm">
          <h2 className="font-serif text-xl">Add a profile photo</h2>
          <p className="mt-2 text-sm text-ink/55">Optional — stored on your account and shown when you match.</p>
          <div className="mt-5">
            <ProfilePhotoUploadPanel
              userId={userId}
              photos={profile?.photos ?? []}
              primary={profile?.primary_photo ?? null}
              compact
              fallbackInitial={profile?.first_name?.trim().charAt(0) || "?"}
              onChange={({ photos, primary }) => {
                setProfile((current) =>
                  current ? { ...current, photos, primary_photo: primary } : current
                );
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <Card
          title="Profile"
          value={`${completion}% complete`}
          link={{
            to: completion >= 80 ? "/profile" : "/onboarding",
            label: completion >= 80 ? "View profile" : "Continue setup",
          }}
          accent="coral"
        />
        <Card
          title="Verification"
          value={profile?.email_verified ? "Email verified" : "Verify email"}
          link={{ to: "/verification", label: "Verification" }}
          accent="teal"
        />
        <Card
          title="Messages"
          value="Your inbox"
          link={{ to: "/messages", label: "Open messages" }}
          accent="ink"
        />
      </div>

      <div className="mt-16 rounded-[1.5rem] border border-ink/10 bg-paper/80 p-8 shadow-[0_20px_50px_-35px_rgba(32,23,20,0.3)]">
        <h2 className="font-serif text-2xl">Where to go next</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60">
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
  accent = "coral",
}: {
  title: string;
  value: string;
  link: { to: string; label: string };
  accent?: "coral" | "teal" | "ink";
}) {
  const ring =
    accent === "teal"
      ? "ring-teal/15 hover:ring-teal/30"
      : accent === "ink"
        ? "ring-ink/10 hover:ring-ink/20"
        : "ring-accent/15 hover:ring-accent/30";

  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm ring-2 ${ring} transition-all hover:-translate-y-1 hover:shadow-md`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">{title}</p>
      <p className="mt-3 font-serif text-3xl leading-tight">{value}</p>
      <Link
        to={link.to}
        className="mt-5 inline-flex rounded-full bg-ink/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent transition-colors hover:bg-accent hover:text-paper"
      >
        {link.label} →
      </Link>
    </div>
  );
}

function QuickLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full border-2 border-ink/12 bg-paper px-6 py-2.5 text-sm font-semibold text-ink/75 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:text-ink hover:shadow-md"
    >
      {children}
    </Link>
  );
}
