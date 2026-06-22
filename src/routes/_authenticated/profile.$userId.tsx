import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { discoverProfiles, sendLike } from "@/lib/dating.functions";
import { SafetyActions } from "@/components/site/SafetyActions";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  head: () => ({ meta: [{ title: "Profile — Anew" }, { name: "robots", content: "noindex" }] }),
  component: PublicProfilePage,
});

function ageFromDob(dob: string | null): string | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return String(age);
}

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { userId: currentUserId } = Route.useRouteContext();
  const fetchProfiles = useServerFn(discoverProfiles);
  const doLike = useServerFn(sendLike);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["discover"],
    queryFn: () => fetchProfiles(),
  });

  const profile = data?.profiles.find((p) => p.id === userId);

  const likeMutation = useMutation({
    mutationFn: () => doLike({ data: { likedId: userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
    },
  });

  const photoUrl = profile?.primary_photo_url ?? null;

  const age = ageFromDob(profile?.date_of_birth ?? null);

  const goalLabel: Record<string, string> = {
    long_term: "A long-term partner",
    friendship: "Friendship first",
    open_to_explore: "Open to explore",
    marriage: "Marriage",
  };

  const isMe = userId === currentUserId;

  if (!profile) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm text-ink/50">Profile not found.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <Link to="/discover" className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink">
        ← Back to Discover
      </Link>

      <div className="mt-10 flex items-start gap-6 md:gap-8">
        <div className="shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="h-24 w-24 md:h-32 md:w-32 object-cover border border-ink/10" />
          ) : (
            <div className="h-24 w-24 md:h-32 md:w-32 border border-ink/10 bg-muted-warm flex items-center justify-center">
              <span className="font-serif text-3xl text-ink/30">
                {profile.first_name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight">
            {profile.first_name ?? "Member"}
            {age ? <span className="ml-2 text-lg font-sans text-ink/50">{age}</span> : null}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {profile.city ?? ""}
            {profile.city && profile.country ? ", " : ""}
            {profile.country ?? ""}
          </p>
          {profile.relationship_goal && (
            <p className="mt-2 text-xs text-ink/60">{goalLabel[profile.relationship_goal] ?? profile.relationship_goal}</p>
          )}
          {profile.open_to_second_chance && (
            <span className="mt-3 inline-block border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-accent">
              Starting a new chapter
            </span>
          )}
        </div>
      </div>

      <div className="mt-12 space-y-8">
        {profile.bio && (
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40">Bio</span>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.new_chapter_answer && (
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40">New chapter</span>
            <p className="mt-2 border-l-2 border-accent/30 pl-4 text-sm text-ink/70 leading-relaxed italic">
              {profile.new_chapter_answer}
            </p>
          </div>
        )}

        {(profile.values?.length ?? 0) > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40">Values</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.values!.map((v) => (
                <span key={v} className="border border-ink/10 px-3 py-1 text-xs text-ink/70">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.interests?.length ?? 0) > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40">Interests</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.interests!.map((i) => (
                <span key={i} className="border border-ink/10 px-3 py-1 text-xs text-ink/70">
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isMe && (
        <div className="mt-12 space-y-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className="bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-paper hover:bg-accent transition-colors disabled:opacity-60"
            >
              {likeMutation.isPending ? "…" : "Like"}
            </button>
          </div>
          <div className="border-t border-ink/10 pt-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-3">Safety</p>
            <SafetyActions targetUserId={userId} />
          </div>
        </div>
      )}
    </section>
  );
}
