import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { listApplications, reviewApplication } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Anew Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminApplications,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-serif text-3xl">Access denied</h1>
      <p className="mt-4 text-sm text-ink/60">{error.message}</p>
      <Link to="/dashboard" className="mt-6 inline-block text-[11px] uppercase tracking-[0.25em] text-accent">
        ← Dashboard
      </Link>
    </div>
  ),
});

type Item = {
  id: string;
  email: string;
  first_name: string;
  message: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

function AdminApplications() {
  const listFn = useServerFn(listApplications);
  const reviewFn = useServerFn(reviewApplication);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; decision: "approved" | "denied" }) =>
      reviewFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      toast.success("Decision recorded");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  if (error) {
    throw error;
  }

  const items = (data?.items ?? []) as Item[];
  const pending = items.filter((i) => i.status === "pending");
  const decided = items.filter((i) => i.status !== "pending");

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Admin</span>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl">Applications</h1>
      <p className="mt-4 text-ink/60">
        {pending.length} pending · approving an email lets that person create their
        real account at /auth — tell them yourself once you've decided.
      </p>

      <div className="mt-12 space-y-6">
        {pending.length === 0 ? (
          <p className="text-ink/50 italic">Nothing to review. Take a breath.</p>
        ) : (
          pending.map((item) => (
            <ApplicationCard
              key={item.id}
              item={item}
              busy={mutate.isPending}
              onDecide={(decision) => mutate.mutate({ id: item.id, decision })}
            />
          ))
        )}
      </div>

      {decided.length > 0 && (
        <div className="mt-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/40">
            Decided
          </p>
          <div className="mt-4 divide-y divide-ink/10 border border-ink/10">
            {decided.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{item.first_name}</p>
                  <p className="text-xs text-ink/50">{item.email}</p>
                </div>
                <span
                  className={`text-[11px] uppercase tracking-[0.2em] ${
                    item.status === "approved" ? "text-teal" : "text-ink/40"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ApplicationCard({
  item,
  busy,
  onDecide,
}: {
  item: Item;
  busy: boolean;
  onDecide: (decision: "approved" | "denied") => void;
}) {
  return (
    <div className="border border-ink/10 p-6 md:p-8 grid gap-6 md:grid-cols-[1fr_2fr]">
      <div>
        <p className="font-serif text-2xl">{item.first_name}</p>
        <p className="mt-1 text-sm text-ink/60 break-all">{item.email}</p>
        <p className="mt-3 text-[11px] text-ink/40">
          Applied {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
      <div>
        {item.message ? (
          <p className="text-sm text-ink/70 italic">"{item.message}"</p>
        ) : (
          <p className="text-sm text-ink/40">No message included.</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecide("approved")}
            className="border border-ink bg-ink text-paper px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:opacity-90 disabled:opacity-40"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecide("denied")}
            className="border border-ink/30 px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:border-ink disabled:opacity-40"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
