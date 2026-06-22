import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { listContactMessages, setContactHandled } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/contact")({
  head: () => ({
    meta: [
      { title: "Contact inbox — Anew Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminContact,
});

function AdminContact() {
  const fn = useServerFn(listContactMessages);
  const upd = useServerFn(setContactHandled);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "contact"],
    queryFn: () => fn(),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; handled: boolean }) => upd({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contact"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Inbox</h1>
      <p className="mt-3 text-ink/60">Messages from the contact form.</p>

      <div className="mt-10 space-y-4">
        {isLoading ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : (data?.items ?? []).length === 0 ? (
          <p className="text-sm text-ink/50 italic">Inbox is empty.</p>
        ) : (
          (data?.items ?? []).map((m: any) => (
            <div
              key={m.id}
              className={`border p-6 ${m.handled ? "border-ink/10 opacity-60" : "border-ink/20"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-serif text-xl">{m.name}</p>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {m.email}
                  </a>
                  {m.subject ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-ink/50">
                      {m.subject}
                    </p>
                  ) : null}
                </div>
                <span className="text-[11px] text-ink/40">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-4 text-sm text-ink/80 whitespace-pre-wrap">{m.message}</p>
              <button
                onClick={() => mut.mutate({ id: m.id, handled: !m.handled })}
                className="mt-4 border border-ink/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] hover:border-ink"
              >
                {m.handled ? "Mark unhandled" : "Mark handled"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
