import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { ProfilePhoto } from "@/components/site/ProfilePhoto";
import { getLikes, sendLike } from "@/lib/dating.functions";

export const Route = createFileRoute("/_authenticated/likes")({
  head: () => ({ meta: [{ title: "Likes — Anew" }, { name: "robots", content: "noindex" }] }),
  component: LikesPage,
});

function LikesPage() {
  const fetchLikes = useServerFn(getLikes);
  const doLike = useServerFn(sendLike);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"received" | "sent">("received");

  const { data, isLoading } = useQuery({
    queryKey: ["likes"],
    queryFn: () => fetchLikes(),
  });

  const likeBack = useMutation({
    mutationFn: (likedId: string) => doLike({ data: { likedId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["discover"] });
    },
  });

  const received = data?.received ?? [];
  const sent = data?.sent ?? [];

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Connections</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">Likes</h1>
      <p className="mt-4 max-w-xl text-sm text-ink/60 leading-relaxed">
        People who expressed interest in you, and those you have reached out to.
      </p>

      <div className="mt-10 flex gap-6 border-b border-ink/10">
        <button
          type="button"
          onClick={() => setTab("received")}
          className={`pb-3 text-[11px] uppercase tracking-[0.25em] transition-colors ${
            tab === "received" ? "text-ink border-b-2 border-ink" : "text-ink/50 hover:text-ink"
          }`}
        >
          Received ({received.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`pb-3 text-[11px] uppercase tracking-[0.25em] transition-colors ${
            tab === "sent" ? "text-ink border-b-2 border-ink" : "text-ink/50 hover:text-ink"
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {isLoading && <p className="mt-8 text-sm text-ink/50">Loading…</p>}

      {!isLoading && tab === "received" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {received.length === 0 && (
            <p className="text-sm text-ink/50 col-span-full">No one has liked you yet. Your profile is visible — be patient.</p>
          )}
          {received.map((item) => (
            <PersonRow
              key={item.id}
              profile={item.profile}
              action={
                <button
                  type="button"
                  onClick={() => likeBack.mutate(item.liker_id)}
                  disabled={likeBack.isPending}
                  className="bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-paper hover:bg-accent transition-colors disabled:opacity-60"
                >
                  {likeBack.isPending ? "…" : "Like back"}
                </button>
              }
            />
          ))}
        </div>
      )}

      {!isLoading && tab === "sent" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sent.length === 0 && (
            <p className="text-sm text-ink/50 col-span-full">You have not sent any likes yet. Go to Discover to meet people.</p>
          )}
          {sent.map((item) => (
            <PersonRow key={item.id} profile={item.profile} />
          ))}
        </div>
      )}
    </section>
  );
}

function PersonRow({
  profile,
  action,
}: {
  profile: { id: string; first_name: string | null; primary_photo: string | null; primary_photo_url?: string | null; city: string | null; country: string | null } | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border border-ink/10 p-4">
      <Link to={`/profile/${profile?.id}`} className="shrink-0">
        <ProfilePhoto
          path={profile?.primary_photo}
          alt=""
          className="h-14 w-14 object-cover border border-ink/10"
          fallbackClassName="h-14 w-14 border border-ink/10 bg-muted-warm flex items-center justify-center"
          fallbackInitial={profile?.first_name?.charAt(0).toUpperCase() ?? "?"}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${profile?.id}`} className="font-serif text-sm hover:text-accent transition-colors">
          {profile?.first_name ?? "Member"}
        </Link>
        <p className="text-[10px] text-ink/50 uppercase tracking-[0.2em]">
          {profile?.city ?? ""}
          {profile?.city && profile?.country ? ", " : ""}
          {profile?.country ?? ""}
        </p>
      </div>
      {action}
    </div>
  );
}
