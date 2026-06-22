import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ProfilePhoto } from "@/components/site/ProfilePhoto";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Anew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

type VerificationKind = "email" | "phone" | "selfie";
type VerificationStatus = "pending" | "approved" | "rejected";

type VerificationRow = {
  id: string;
  kind: VerificationKind;
  status: VerificationStatus;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type Profile = {
  first_name: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  date_of_birth: string | null;
  gender: string | null;
  dating_preference: string | null;
  relationship_goal: string | null;
  primary_photo: string | null;
  photos: string[] | null;
  profile_completion: number | null;
  onboarding_completed: boolean | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  selfie_verified: boolean | null;
  values: string[] | null;
  interests: string[] | null;
  new_chapter_answer: string | null;
};

function ProfilePage() {
  const { userId } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [{ data: pData }, { data: vData }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "first_name,bio,city,country,date_of_birth,gender,dating_preference,relationship_goal,primary_photo,photos,profile_completion,onboarding_completed,email_verified,phone_verified,selfie_verified,values,interests,new_chapter_answer"
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("verifications")
        .select("id,kind,status,notes,created_at,reviewed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    setProfile(pData);
    setVerifications((vData as VerificationRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    const channel = supabase
      .channel("profile-verifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function latestFor(kind: VerificationKind): VerificationRow | undefined {
    return verifications.find((r) => r.kind === kind);
  }

  const overallTrust = useMemo(() => {
    const flags = [
      profile?.email_verified,
      profile?.phone_verified,
      profile?.selfie_verified,
    ];
    const passed = flags.filter(Boolean).length;
    if (passed === 3) return "verified" as const;
    if (passed > 0) return "partial" as const;
    return "none" as const;
  }, [profile]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink"
        >
          ← Back
        </Link>
        <Link
          to="/profile/edit"
          className="text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink"
        >
          Edit profile →
        </Link>
      </div>

      <div className="mt-8 flex items-start gap-6 md:gap-8">
        <div className="shrink-0">
          <ProfilePhoto
            path={profile?.primary_photo}
            alt="Profile"
            className="h-20 w-20 md:h-24 md:w-24 object-cover border border-ink/10"
            fallbackClassName="h-20 w-20 md:h-24 md:w-24 border border-ink/10 bg-muted-warm flex items-center justify-center"
            fallbackInitial={profile?.first_name?.charAt(0).toUpperCase() ?? "?"}
          />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight">
            {profile?.first_name ?? "Member"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {profile?.city ?? ""}
            {profile?.city && profile?.country ? ", " : ""}
            {profile?.country ?? ""}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <TrustBadge level={overallTrust} />
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40">
              {overallTrust === "verified"
                ? "Fully verified"
                : overallTrust === "partial"
                ? "Partially verified"
                : "Verification needed"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <StatCard
          label="Profile completion"
          value={`${profile?.profile_completion ?? 0}%`}
        />
        <StatCard
          label="Onboarding"
          value={profile?.onboarding_completed ? "Done" : "Incomplete"}
        />
        <StatCard
          label="Photos"
          value={String((profile?.photos ?? []).length)}
        />
      </div>

      <div className="mt-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">
              Trust
            </span>
            <h2 className="mt-2 font-serif text-2xl">Verification status</h2>
            <p className="mt-2 text-sm text-ink/60 max-w-lg">
              Real-time updates as our team reviews your submissions. All
              changes appear instantly — no need to refresh.
            </p>
          </div>
          <Link
            to="/verification"
            className="shrink-0 text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink"
          >
            Update →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <VerificationCard
            kind="email"
            title="Email"
            flag={profile?.email_verified ?? false}
            row={latestFor("email")}
          />
          <VerificationCard
            kind="phone"
            title="Phone"
            flag={profile?.phone_verified ?? false}
            row={latestFor("phone")}
          />
          <VerificationCard
            kind="selfie"
            title="Selfie / ID"
            flag={profile?.selfie_verified ?? false}
            row={latestFor("selfie")}
          />
        </div>
      </div>

      <div className="mt-16 border-t border-ink/10 pt-10">
        <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">
          About
        </span>
        <h2 className="mt-2 font-serif text-2xl">Your story</h2>
        <div className="mt-6 space-y-4 text-sm text-ink/70 leading-relaxed max-w-2xl">
          {profile?.bio ? (
            <p>{profile.bio}</p>
          ) : (
            <p className="text-ink/40 italic">
              No bio yet. Tell people who you are becoming.
            </p>
          )}
          {profile?.new_chapter_answer ? (
            <p className="border-l-2 border-accent/30 pl-4">
              {profile.new_chapter_answer}
            </p>
          ) : null}
        </div>

        {(profile?.values?.length ?? 0) > 0 && (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-2">
              Values
            </p>
            <div className="flex flex-wrap gap-2">
              {profile!.values!.map((v) => (
                <span
                  key={v}
                  className="border border-ink/10 px-3 py-1 text-xs text-ink/70"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile?.interests?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-2">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {profile!.interests!.map((i) => (
                <span
                  key={i}
                  className="border border-ink/10 px-3 py-1 text-xs text-ink/70"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TrustBadge({ level }: { level: "verified" | "partial" | "none" }) {
  const cls =
    level === "verified"
      ? "bg-accent/10 text-accent border-accent/30"
      : level === "partial"
      ? "bg-ink/5 text-ink/70 border-ink/20"
      : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] ${cls}`}
    >
      {level === "verified"
        ? "Verified"
        : level === "partial"
        ? "Partial"
        : "Unverified"}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/10 p-5 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">
        {label}
      </p>
      <p className="font-serif text-2xl">{value}</p>
    </div>
  );
}

function VerificationCard({
  kind,
  title,
  flag,
  row,
}: {
  kind: VerificationKind;
  title: string;
  flag: boolean;
  row?: VerificationRow;
}) {
  const status: VerificationStatus | "missing" = flag
    ? "approved"
    : row?.status ?? "missing";

  const statusLabel =
    status === "approved"
      ? "Approved"
      : status === "pending"
      ? "In review"
      : status === "rejected"
      ? "Rejected"
      : "Not started";

  const statusClass =
    status === "approved"
      ? "bg-accent/10 text-accent border-accent/30"
      : status === "pending"
      ? "bg-ink/5 text-ink/70 border-ink/20"
      : status === "rejected"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-paper text-ink/40 border-ink/10";

  const nextStep =
    status === "approved"
      ? "All set. This verification is complete."
      : status === "pending"
      ? "Our team is reviewing your submission. You will see the result here as soon as it is ready."
      : status === "rejected"
      ? row?.notes
        ? `Feedback: ${row.notes}. Please resubmit with the requested changes.`
        : "Your submission could not be approved. Please try again with clearer information."
      : kind === "email"
      ? "Confirm your email address to unlock messaging and matching."
      : kind === "phone"
      ? "Add your phone number so our team can confirm your identity."
      : "Upload a selfie holding today's date to verify you are who you say you are.";

  return (
    <div className="border border-ink/10 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg">{title}</h3>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {row?.created_at && status !== "approved" ? (
        <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40">
          Submitted {new Date(row.created_at).toLocaleDateString()}
          {row.reviewed_at
            ? ` • Reviewed ${new Date(row.reviewed_at).toLocaleDateString()}`
            : ""}
        </p>
      ) : null}

      <p className="text-sm text-ink/60 leading-relaxed">{nextStep}</p>

      {status !== "approved" && status !== "pending" && (
        <Link
          to="/verification"
          className="inline-block mt-1 text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink"
        >
          {status === "rejected" ? "Resubmit →" : "Start →"}
        </Link>
      )}
    </div>
  );
}
