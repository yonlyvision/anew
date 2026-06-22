import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  listPendingVerifications,
  reviewVerification,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/verifications")({
  head: () => ({
    meta: [
      { title: "Verification review — Anew Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVerifications,
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

function AdminVerifications() {
  const listFn = useServerFn(listPendingVerifications);
  const reviewFn = useServerFn(reviewVerification);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "verifications", "pending"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; decision: "approved" | "rejected"; notes?: string }) =>
      reviewFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "verifications", "pending"] });
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

  const items = data?.items ?? [];

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Admin</span>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl">Verification queue</h1>
      <p className="mt-4 text-ink/60">{items.length} pending</p>

      <div className="mt-12 space-y-6">
        {items.length === 0 ? (
          <p className="text-ink/50 italic">Nothing to review. Take a breath.</p>
        ) : (
          items.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              busy={mutate.isPending}
              onDecide={(decision, notes) =>
                mutate.mutate({ id: item.id, decision, notes })
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

type Item = {
  id: string;
  userId: string;
  firstName: string | null;
  kind: "email" | "phone" | "selfie";
  status: string;
  notes: string | null;
  createdAt: string;
  evidenceUrl: string | null;
};

function ReviewCard({
  item,
  busy,
  onDecide,
}: {
  item: Item;
  busy: boolean;
  onDecide: (decision: "approved" | "rejected", notes?: string) => void;
}) {
  const [notes, setNotes] = useState("");
  return (
    <div className="border border-ink/10 p-6 md:p-8 grid gap-6 md:grid-cols-[1fr_2fr]">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{item.kind}</p>
        <p className="mt-2 font-serif text-2xl">{item.firstName || "Member"}</p>
        <p className="mt-1 text-xs text-ink/40 break-all">{item.userId}</p>
        <p className="mt-3 text-[11px] text-ink/40">
          Submitted {new Date(item.createdAt).toLocaleString()}
        </p>
        {item.notes ? (
          <p className="mt-3 text-sm text-ink/70 italic">"{item.notes}"</p>
        ) : null}
      </div>
      <div>
        {item.kind === "selfie" && item.evidenceUrl ? (
          <img
            src={item.evidenceUrl}
            alt="Selfie evidence"
            className="w-full max-h-80 object-contain border border-ink/10 bg-ink/5"
          />
        ) : (
          <p className="text-sm text-ink/60">No image evidence for this kind.</p>
        )}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes (optional)"
          maxLength={1000}
          className="mt-4 w-full border border-ink/20 bg-paper p-3 text-sm focus:outline-none focus:border-ink min-h-20"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecide("approved", notes || undefined)}
            className="border border-ink bg-ink text-paper px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:opacity-90 disabled:opacity-40"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecide("rejected", notes || undefined)}
            className="border border-ink/30 px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:border-ink disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
