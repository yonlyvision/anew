import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { listStories, upsertStory, deleteStory } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/stories")({
  head: () => ({
    meta: [
      { title: "Stories — Anew Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminStories,
});

type Draft = {
  id?: string;
  title: string;
  body: string;
  cover_image: string;
  published: boolean;
};

const empty: Draft = { title: "", body: "", cover_image: "", published: false };

function AdminStories() {
  const listFn = useServerFn(listStories);
  const upsertFn = useServerFn(upsertStory);
  const deleteFn = useServerFn(deleteStory);
  const qc = useQueryClient();

  const [draft, setDraft] = useState<Draft>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stories"],
    queryFn: () => listFn(),
  });

  const save = useMutation({
    mutationFn: (d: Draft) =>
      upsertFn({
        data: {
          id: d.id,
          title: d.title,
          body: d.body,
          cover_image: d.cover_image || undefined,
          published: d.published,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "stories"] });
      toast.success("Saved");
      setDraft(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "stories"] });
      toast.success("Deleted");
      setDraft(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16 grid lg:grid-cols-[1fr_360px] gap-12">
      <div>
        <h1 className="font-serif text-4xl md:text-5xl">
          {draft.id ? "Edit story" : "New story"}
        </h1>
        <p className="mt-3 text-ink/60 max-w-lg">
          Curated success stories for the public site.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
          className="mt-8 space-y-5"
        >
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.25em] text-ink/60 mb-2">
              Title
            </span>
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-base focus:outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.25em] text-ink/60 mb-2">
              Cover image URL (optional)
            </span>
            <input
              type="url"
              value={draft.cover_image}
              onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-sm focus:outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.25em] text-ink/60 mb-2">
              Story
            </span>
            <textarea
              required
              maxLength={20000}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-sm leading-relaxed focus:outline-none focus:border-ink min-h-72"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            />
            Published
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="border border-ink bg-ink text-paper px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] disabled:opacity-40"
            >
              {draft.id ? "Save changes" : "Publish story"}
            </button>
            {draft.id ? (
              <>
                <button
                  type="button"
                  onClick={() => setDraft(empty)}
                  className="text-[11px] uppercase tracking-[0.25em] text-ink/60"
                >
                  Cancel edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this story?")) remove.mutate(draft.id!);
                  }}
                  className="ml-auto text-[11px] uppercase tracking-[0.25em] text-rose-700"
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </form>
      </div>

      <aside>
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-ink/50">All stories</h2>
        <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {isLoading ? (
            <p className="py-6 text-sm text-ink/50">Loading…</p>
          ) : (data?.items ?? []).length === 0 ? (
            <p className="py-6 text-sm text-ink/50 italic">No stories yet.</p>
          ) : (
            (data?.items ?? []).map((s: any) => (
              <button
                key={s.id}
                onClick={() =>
                  setDraft({
                    id: s.id,
                    title: s.title,
                    body: s.body,
                    cover_image: s.cover_image ?? "",
                    published: s.published,
                  })
                }
                className="w-full text-left py-4 hover:bg-ink/[0.02] px-2 -mx-2"
              >
                <p className="font-serif text-base">{s.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/40">
                  {s.published ? "Published" : "Draft"} ·{" "}
                  {new Date(s.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
