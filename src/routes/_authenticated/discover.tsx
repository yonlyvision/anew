import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { discoverProfiles, getLikeQuota, sendLike } from "@/lib/dating.functions";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Anew" }, { name: "robots", content: "noindex" }] }),
  component: DiscoverPage,
});

function ageFromDob(dob: string | null): string | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return String(age);
}

function DiscoverPage() {
  const fetchProfiles = useServerFn(discoverProfiles);
  const fetchQuota = useServerFn(getLikeQuota);
  const doLike = useServerFn(sendLike);
  const queryClient = useQueryClient();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["discover"],
    queryFn: () => fetchProfiles(),
  });
  const { data: quota } = useQuery({
    queryKey: ["likes", "quota"],
    queryFn: () => fetchQuota(),
  });

  const likeMutation = useMutation({
    mutationFn: (likedId: string) => doLike({ data: { likedId } }),
    onSuccess: (result, likedId) => {
      setLikedIds((previous) => new Set(previous).add(likedId));
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      queryClient.invalidateQueries({ queryKey: ["likes", "quota"] });
      toast.success(result.matched ? "It’s a match." : "Like sent.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not send like");
    },
  });

  const profiles = (data?.profiles ?? []).filter((profile) => !likedIds.has(profile.id));

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Discover
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-6xl">
            Discovery should feel less random.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
            These profiles surface more than attraction. You can see readiness,
            trust signals, relationship intent, and conversation material before
            deciding who deserves your attention.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:min-w-[26rem]">
          <InfoCard label="Today’s likes">
            {quota?.premium
              ? "Unlimited with Premium."
              : `${quota?.remaining ?? 0} of ${quota?.limit ?? 0} remaining today.`}
          </InfoCard>
          <InfoCard label="Designed to help">
            Prompt-led discovery creates better openers than pure photo-first swiping.
          </InfoCard>
        </div>
      </div>

      {quota && !quota.premium && (
        <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-ink/48">
          Free members have a daily like limit.{" "}
          <Link to="/pricing" className="text-accent hover:text-ink">
            Upgrade for unlimited likes →
          </Link>
        </p>
      )}

      {isLoading && (
        <div className="mt-14">
          <p className="text-sm text-ink/50">Loading profiles…</p>
        </div>
      )}

      {!isLoading && profiles.length === 0 && (
        <div className="mt-14 rounded-[2rem] border border-ink/8 bg-card/88 px-8 py-10 text-center">
          <p className="font-serif text-3xl leading-tight text-ink">
            You have seen everyone for now.
          </p>
          <p className="mt-3 text-sm leading-7 text-ink/56">
            Come back later. New members join every day, and verified profiles
            move through the queue as they complete their setup.
          </p>
        </div>
      )}

      <div className="mt-12 grid gap-6 xl:grid-cols-2">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onLike={() => likeMutation.mutate(profile.id)}
            isLiking={likeMutation.isPending && likeMutation.variables === profile.id}
          />
        ))}
      </div>
    </section>
  );
}

function ProfileCard({
  profile,
  onLike,
  isLiking,
}: {
  profile: {
    id: string;
    first_name: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    date_of_birth: string | null;
    relationship_goal: string | null;
    primary_photo: string | null;
    primary_photo_url?: string | null;
    values: string[] | null;
    interests: string[] | null;
    new_chapter_answer: string | null;
    open_to_second_chance: boolean | null;
    profile_completion: number | null;
    is_premium?: boolean | null;
    selfie_verified?: boolean | null;
    email_verified?: boolean | null;
    phone_verified?: boolean | null;
    prompts?: Array<{ prompt_key: string; answer: string }>;
  };
  onLike: () => void;
  isLiking: boolean;
}) {
  const photoUrl = profile.primary_photo_url ?? null;
  const age = ageFromDob(profile.date_of_birth);
  const trustCount = [
    profile.email_verified,
    profile.phone_verified,
    profile.selfie_verified,
  ].filter(Boolean).length;

  const goalLabel: Record<string, string> = {
    long_term: "Long-term partner",
    friendship: "Friendship first",
    open_to_explore: "Open to explore",
    marriage: "Marriage",
  };

  const spark =
    profile.prompts?.find((prompt) => prompt.answer.trim())?.answer ??
    profile.new_chapter_answer ??
    profile.bio ??
    "";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-ink/8 bg-paper shadow-[0_28px_80px_-58px_rgba(32,23,20,0.48)]">
      <div className="grid gap-0 md:grid-cols-[18rem_minmax(0,1fr)]">
        <Link
          to="/profile/$userId"
          params={{ userId: profile.id }}
          className="group relative block min-h-[22rem] overflow-hidden bg-muted-warm"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={profile.first_name ?? "Profile"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <FallbackPortrait
              initial={(profile.first_name?.charAt(0) || "?").toUpperCase()}
              accent={profile.open_to_second_chance ? "teal" : "coral"}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/46 via-black/16 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {trustCount > 0 && <TopBadge>Verified {trustCount}/3</TopBadge>}
            {profile.open_to_second_chance && <TopBadge tone="accent">New chapter</TopBadge>}
          </div>
          <div className="absolute right-4 top-4">
            <TopBadge tone="paper">{profile.profile_completion ?? 0}% complete</TopBadge>
          </div>
          <div className="absolute inset-x-4 bottom-4 text-paper">
            <h2 className="font-serif text-4xl leading-none">
              {profile.first_name ?? "Member"}
              {age ? <span className="ml-2 font-sans text-lg text-paper/78">{age}</span> : null}
            </h2>
            <p className="mt-2 text-sm text-paper/76">
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          </div>
        </Link>

        <div className="flex flex-col p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            {profile.relationship_goal && (
              <span className="rounded-full border border-accent/18 bg-accent/8 px-3 py-1 text-[11px] font-medium text-accent">
                {goalLabel[profile.relationship_goal] ?? profile.relationship_goal}
              </span>
            )}
            {profile.is_premium && (
              <span className="rounded-full border border-gold/22 bg-gold/12 px-3 py-1 text-[11px] font-medium text-ink">
                Premium
              </span>
            )}
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-ink/8 bg-card/82 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal">
              Conversation spark
            </p>
            <p className="mt-3 text-sm leading-7 text-ink/62">
              {spark || "Still finishing their story."}
            </p>
          </div>

          {(profile.values?.length ?? 0) > 0 && (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/42">Values</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.values!.slice(0, 4).map((value) => (
                  <span
                    key={value}
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/60"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(profile.interests?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/42">Interests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests!.slice(0, 4).map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-accent/14 bg-accent/7 px-3 py-1 text-xs text-accent"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <ProfileSignal active={trustCount >= 2}>Strong trust signals</ProfileSignal>
            <ProfileSignal active={!!profile.relationship_goal}>Intent is clearly stated</ProfileSignal>
            <ProfileSignal active={(profile.values?.length ?? 0) >= 3}>Values are easy to read</ProfileSignal>
            <ProfileSignal active={spark.trim().length >= 40}>Conversation starter ready</ProfileSignal>
          </div>

          <div className="mt-7 flex flex-1 items-end gap-3">
            <Link
              to="/profile/$userId"
              params={{ userId: profile.id }}
              className="flex-1 rounded-full border border-ink/12 py-3 text-center text-[11px] uppercase tracking-[0.24em] text-ink/68 transition-colors hover:border-ink hover:text-ink"
            >
              View profile
            </Link>
            <button
              type="button"
              onClick={onLike}
              disabled={isLiking}
              className="flex-1 rounded-full bg-ink py-3 text-[11px] uppercase tracking-[0.24em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
            >
              {isLiking ? "Sending…" : "Send like"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FallbackPortrait({
  initial,
  accent,
}: {
  initial: string;
  accent: "coral" | "teal";
}) {
  const background =
    accent === "teal"
      ? "bg-[radial-gradient(circle_at_30%_20%,_rgba(244,249,246,0.92),_transparent_22%),radial-gradient(circle_at_76%_18%,_rgba(46,138,146,0.28),_transparent_24%),linear-gradient(180deg,_rgba(178,208,202,0.72),_rgba(68,88,83,0.92))]"
      : "bg-[radial-gradient(circle_at_30%_20%,_rgba(255,245,232,0.92),_transparent_22%),radial-gradient(circle_at_76%_18%,_rgba(229,98,84,0.24),_transparent_24%),linear-gradient(180deg,_rgba(229,189,161,0.72),_rgba(104,79,67,0.92))]";

  return (
    <div className={`relative h-full w-full ${background}`}>
      <div className="absolute left-1/2 top-[18%] h-32 w-32 -translate-x-1/2 rounded-full bg-white/18 blur-3xl" />
      <div className="absolute left-1/2 top-[32%] flex h-40 w-40 -translate-x-1/2 items-center justify-center rounded-full border border-white/26 bg-white/12 backdrop-blur">
        <div className="flex h-26 w-26 items-center justify-center rounded-full border border-white/24 bg-white/18 font-serif text-6xl text-paper">
          {initial}
        </div>
      </div>
    </div>
  );
}

function TopBadge({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: "teal" | "accent" | "paper";
}) {
  const className =
    tone === "accent"
      ? "bg-accent/88 text-paper"
      : tone === "paper"
      ? "bg-paper/88 text-ink"
      : "bg-teal/88 text-paper";

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur ${className}`}
    >
      {children}
    </span>
  );
}

function ProfileSignal({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          active ? "bg-teal" : "bg-ink/18"
        }`}
      />
      <p className={`text-sm ${active ? "text-ink/68" : "text-ink/42"}`}>{children}</p>
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/8 bg-paper/88 px-5 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/44">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-ink/60">{children}</p>
    </div>
  );
}
