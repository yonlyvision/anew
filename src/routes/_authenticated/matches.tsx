import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getMatches } from "@/lib/dating.functions";
import { ProfilePhoto } from "@/components/site/ProfilePhoto";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Matches — Anew" }, { name: "robots", content: "noindex" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const fetchMatches = useServerFn(getMatches);

  const { data, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => fetchMatches(),
  });

  const matches = data?.matches ?? [];

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Connections</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">Matches</h1>
      <p className="mt-4 max-w-xl text-sm text-ink/60 leading-relaxed">
        These are the people who liked you back. Take your time. Start with a kind message.
      </p>

      {isLoading && <p className="mt-8 text-sm text-ink/50">Loading…</p>}

      {!isLoading && matches.length === 0 && (
        <div className="mt-12 border border-ink/10 p-8 text-center">
          <p className="font-serif text-xl">No matches yet.</p>
          <p className="mt-2 text-sm text-ink/50">
            When someone you liked likes you back, they will appear here.
          </p>
          <Link to="/discover" className="mt-6 inline-block text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink">
            Go to Discover →
          </Link>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({
  match,
}: {
  match: {
    id: string;
    createdAt: string;
    otherId: string;
    otherProfile: {
      id: string;
      first_name: string | null;
      primary_photo: string | null;
      primary_photo_url?: string | null;
    } | null;
  };
}) {
  const profile = match.otherProfile;

  return (
    <div className="border border-ink/10 p-5 flex items-center gap-4">
      <Link to={`/profile/${profile?.id}`} className="shrink-0">
        <ProfilePhoto
          path={profile?.primary_photo}
          alt=""
          className="h-16 w-16 object-cover border border-ink/10"
          fallbackClassName="h-16 w-16 border border-ink/10 bg-muted-warm flex items-center justify-center"
          fallbackInitial={profile?.first_name?.charAt(0).toUpperCase() ?? "?"}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${profile?.id}`} className="font-serif text-base hover:text-accent transition-colors">
          {profile?.first_name ?? "Member"}
        </Link>
        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink/40">
          Matched {new Date(match.createdAt).toLocaleDateString()}
        </p>
      </div>
      <Link
        to={`/messages/${match.id}`}
        className="shrink-0 bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-paper hover:bg-accent transition-colors"
      >
        Message
      </Link>
    </div>
  );
}
