import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { listContentForReview, removeProfilePhoto, setMemberPause } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  head: () => ({
    meta: [{ title: "Moderation — Anew Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: ModerationPage,
});

function ModerationPage() {
  const fn = useServerFn(listContentForReview);
  const pauseFn = useServerFn(setMemberPause);
  const removeFn = useServerFn(removeProfilePhoto);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "moderation"],
    queryFn: () => fn(),
  });

  const pause = useMutation({
    mutationFn: (vars: { userId: string; paused: boolean }) => pauseFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "moderation"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removePhoto = useMutation({
    mutationFn: (vars: { userId: string; photoPath: string }) => removeFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "moderation"] });
      toast.success("Photo removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const items = data?.items ?? [];
  const flagged = items.filter((i: { flagged: boolean }) => i.flagged);
  const recent = items.filter((i: { flagged: boolean }) => !i.flagged);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Content moderation</h1>
      <p className="mt-3 text-ink/60">
        Review photos, bios, and prompts. Remove individual photos or pause accounts.
      </p>

      {isLoading && <p className="mt-10 text-sm text-ink/50">Loading…</p>}

      {flagged.length > 0 && (
        <>
          <h2 className="mt-10 text-[11px] uppercase tracking-[0.25em] text-rose-700">
            Flagged by reports ({flagged.length})
          </h2>
          <Grid items={flagged} onPause={pause.mutate} onRemovePhoto={removePhoto.mutate} />
        </>
      )}

      <h2 className="mt-12 text-[11px] uppercase tracking-[0.25em] text-ink/50">
        Recently updated ({recent.length})
      </h2>
      <Grid items={recent} onPause={pause.mutate} onRemovePhoto={removePhoto.mutate} />
    </section>
  );
}

type ModItem = {
  id: string;
  first_name: string | null;
  bio: string | null;
  new_chapter_answer: string | null;
  primary_photo: string | null;
  primary_photo_url?: string | null;
  photos: string[] | null;
  photo_urls?: string[];
  is_paused: boolean;
  flagged: boolean;
};

function Grid({
  items,
  onPause,
  onRemovePhoto,
}: {
  items: ModItem[];
  onPause: (v: { userId: string; paused: boolean }) => void;
  onRemovePhoto: (v: { userId: string; photoPath: string }) => void;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-ink/40 italic">Nothing here.</p>;
  }
  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      {items.map((m) => (
        <div
          key={m.id}
          className={`border p-5 ${m.flagged ? "border-rose-700/40" : "border-ink/10"}`}
        >
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden bg-muted-warm">
              {m.primary_photo_url ? (
                <img
                  src={m.primary_photo_url}
                  alt={m.first_name ?? "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink/20 font-serif text-2xl">
                  {m.first_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-lg">{m.first_name ?? "Member"}</p>
                {m.is_paused && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-rose-700">Paused</span>
                )}
              </div>
              {m.bio && (
                <p className="mt-1 text-xs text-ink/70 line-clamp-3 whitespace-pre-wrap">{m.bio}</p>
              )}
            </div>
          </div>
          {m.new_chapter_answer && (
            <div className="mt-3 border-l-2 border-accent/30 pl-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">New chapter</p>
              <p className="mt-1 text-xs text-ink/70 italic whitespace-pre-wrap line-clamp-4">
                {m.new_chapter_answer}
              </p>
            </div>
          )}
          {(m.photos?.length ?? 0) > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(m.photos ?? []).map((p, idx) => {
                const url = m.photo_urls?.[idx];
                return (
                  <div key={p} className="relative shrink-0">
                    {url ? (
                      <img src={url} alt="" className="h-16 w-16 object-cover border border-ink/10" />
                    ) : (
                      <div className="h-16 w-16 border border-ink/10 bg-muted-warm" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remove this photo?")) onRemovePhoto({ userId: m.id, photoPath: p });
                      }}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
            <Link
              to="/profile/$userId"
              params={{ userId: m.id }}
              className="border border-ink/30 px-3 py-1.5 hover:border-ink"
            >
              View profile
            </Link>
            <button
              type="button"
              onClick={() => onPause({ userId: m.id, paused: !m.is_paused })}
              className="border border-ink/30 px-3 py-1.5 hover:border-ink"
            >
              {m.is_paused ? "Unpause" : "Pause"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
