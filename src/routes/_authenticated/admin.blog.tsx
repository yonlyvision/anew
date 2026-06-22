import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  listBlogPosts,
  getBlogPost,
  upsertBlogPost,
  deleteBlogPost,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({
    meta: [
      { title: "Journal — Anew Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBlog,
});

type Draft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image: string;
  published: boolean;
};

const empty: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image: "",
  published: false,
};

function AdminBlog() {
  const listFn = useServerFn(listBlogPosts);
  const getFn = useServerFn(getBlogPost);
  const upsertFn = useServerFn(upsertBlogPost);
  const deleteFn = useServerFn(deleteBlogPost);
  const qc = useQueryClient();

  const [draft, setDraft] = useState<Draft>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blog"],
    queryFn: () => listFn(),
  });

  const save = useMutation({
    mutationFn: (d: Draft) =>
      upsertFn({
        data: {
          id: d.id,
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt || undefined,
          body: d.body,
          cover_image: d.cover_image || undefined,
          published: d.published,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Saved");
      setDraft(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Deleted");
      setDraft(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function loadForEdit(id: string) {
    const row = await getFn({ data: { id } });
    if (!row) return;
    setDraft({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt ?? "",
      body: row.body,
      cover_image: row.cover_image ?? "",
      published: row.published,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16 grid lg:grid-cols-[1fr_360px] gap-12">
      <div>
        <h1 className="font-serif text-4xl md:text-5xl">
          {draft.id ? "Edit entry" : "New entry"}
        </h1>
        <p className="mt-3 text-ink/60">
          Quiet, considered posts for the Journal.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
          className="mt-8 space-y-5"
        >
          <Field label="Title">
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-base focus:outline-none focus:border-ink"
            />
          </Field>
          <Field label="Slug" hint="lowercase, dashes only">
            <input
              required
              value={draft.slug}
              onChange={(e) =>
                setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
              }
              pattern="[a-z0-9-]+"
              className="w-full border border-ink/20 bg-paper p-3 font-mono text-sm focus:outline-none focus:border-ink"
            />
          </Field>
          <Field label="Cover image URL (optional)">
            <input
              type="url"
              value={draft.cover_image}
              onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-sm focus:outline-none focus:border-ink"
            />
          </Field>
          <Field label="Excerpt">
            <textarea
              maxLength={500}
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-sm focus:outline-none focus:border-ink min-h-20"
            />
          </Field>
          <Field label="Body">
            <textarea
              required
              maxLength={50000}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="w-full border border-ink/20 bg-paper p-3 text-sm leading-relaxed focus:outline-none focus:border-ink min-h-96"
            />
          </Field>
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
              {draft.id ? "Save changes" : "Publish entry"}
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
                    if (confirm("Delete this entry?")) remove.mutate(draft.id!);
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
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-ink/50">All entries</h2>
        <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {isLoading ? (
            <p className="py-6 text-sm text-ink/50">Loading…</p>
          ) : (data?.items ?? []).length === 0 ? (
            <p className="py-6 text-sm text-ink/50 italic">No entries yet.</p>
          ) : (
            (data?.items ?? []).map((p: any) => (
              <button
                key={p.id}
                onClick={() => loadForEdit(p.id)}
                className="w-full text-left py-4 hover:bg-ink/[0.02] px-2 -mx-2"
              >
                <p className="font-serif text-base">{p.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/40">
                  {p.published ? "Published" : "Draft"} ·{" "}
                  {new Date(p.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.25em] text-ink/60 mb-2">
        {label}
        {hint ? <span className="ml-2 text-ink/40 normal-case tracking-normal">— {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
