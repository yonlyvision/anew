import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { listApplications, reviewApplication } from "@/lib/admin.functions";
import {
  copyApprovalEmail,
  copyDenialEmail,
  foundingApprovalEmail,
  foundingDenialEmail,
} from "@/lib/founding-approval-email";
import { parseApplicationDetails } from "@/lib/parse-application-message";

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
      <Link to="/dashboard" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
        ← Back to dashboard
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
  const [emailDraft, setEmailDraft] = useState<{
    kind: "approved" | "denied";
    firstName: string;
    email: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => listFn(),
    refetchInterval: 20_000,
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; decision: "approved" | "denied"; firstName: string; email: string }) =>
      reviewFn({ data: { id: vars.id, decision: vars.decision } }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setEmailDraft({
        kind: vars.decision,
        firstName: vars.firstName,
        email: vars.email,
      });
      toast.success(
        vars.decision === "approved"
          ? "Approved — copy the email below and send it to the applicant"
          : "Denied — optional denial email ready to copy below"
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-48 rounded-xl bg-ink/10" />
          <div className="h-32 rounded-2xl bg-ink/5" />
        </div>
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
    <section className="mx-auto max-w-5xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Applications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/60">
            Review each applicant below. Approving unlocks signup at{" "}
            <code className="rounded-md bg-ink/5 px-1.5 py-0.5 text-xs font-medium">/auth?mode=signup</code>.
            Then copy the ready-made email and send from{" "}
            <code className="rounded-md bg-ink/5 px-1.5 py-0.5 text-xs font-medium">support@inm8tebook.net</code>.
          </p>
        </div>
        {pending.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-5 py-2.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-sm font-semibold text-ink">
              {pending.length} pending
            </span>
          </div>
        )}
      </div>

      {emailDraft && (
        <EmailDraftPanel draft={emailDraft} onDismiss={() => setEmailDraft(null)} />
      )}

      <div className="mt-10 space-y-6">
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-paper/80 px-8 py-12 text-center shadow-sm">
            <p className="font-serif text-2xl text-ink/70">All caught up</p>
            <p className="mt-2 text-sm text-ink/50">No applications waiting for review.</p>
          </div>
        ) : (
          pending.map((item) => (
            <ApplicationCard
              key={item.id}
              item={item}
              busy={mutate.isPending}
              onDecide={(decision) =>
                mutate.mutate({
                  id: item.id,
                  decision,
                  firstName: item.first_name,
                  email: item.email,
                })
              }
            />
          ))
        )}
      </div>

      {decided.length > 0 && (
        <div className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/40">
            Previously decided ({decided.length})
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-sm">
            {decided.map((item, i) => (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${i > 0 ? "border-t border-ink/8" : ""}`}
              >
                <div>
                  <p className="font-medium text-ink">{item.first_name}</p>
                  <p className="text-xs text-ink/50">{item.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      item.status === "approved"
                        ? "bg-teal/12 text-teal"
                        : "bg-ink/8 text-ink/45"
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.status === "approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        setEmailDraft({
                          kind: "approved",
                          firstName: item.first_name,
                          email: item.email,
                        })
                      }
                      className="rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
                    >
                      Copy email
                    </button>
                  )}
                </div>
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
  const fields = parseApplicationDetails(item.message);
  const appliedAt = new Date(item.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-ink/10 bg-paper shadow-[0_20px_50px_-35px_rgba(32,23,20,0.35)] ring-1 ring-accent/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 bg-gradient-to-r from-accent/[0.07] to-transparent px-6 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            New application
          </span>
        </div>
        <time className="text-xs font-medium text-ink/45">{appliedAt}</time>
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:p-8">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">Name</p>
            <p className="mt-1 font-serif text-3xl leading-tight text-ink">{item.first_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">Email</p>
            <p className="mt-1 break-all text-sm font-medium text-ink/75">{item.email}</p>
          </div>
        </div>

        <div>
          {fields.length > 0 ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className={`rounded-xl border border-ink/8 bg-[#faf6f1] px-4 py-3 ${
                    field.label === "What brings them here" ? "sm:col-span-2" : ""
                  }`}
                >
                  <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/42">
                    {field.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium leading-relaxed text-ink/85">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-xl border border-dashed border-ink/15 px-4 py-6 text-sm text-ink/45">
              No extra details submitted.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecide("approved")}
              className="inline-flex min-w-[9rem] items-center justify-center rounded-full bg-gradient-to-r from-ink to-[#3a2c25] px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-paper shadow-[0_12px_28px_-14px_rgba(32,23,20,0.55)] transition-all hover:-translate-y-0.5 hover:from-accent hover:to-[#ef886f] disabled:opacity-40"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecide("denied")}
              className="inline-flex min-w-[9rem] items-center justify-center rounded-full border-2 border-ink/20 bg-paper px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-md disabled:opacity-40"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmailDraftPanel({
  draft,
  onDismiss,
}: {
  draft: { kind: "approved" | "denied"; firstName: string; email: string };
  onDismiss: () => void;
}) {
  const content =
    draft.kind === "approved"
      ? foundingApprovalEmail(draft.firstName, draft.email)
      : foundingDenialEmail(draft.firstName);
  const fullText = `Subject: ${content.subject}\n\n${content.body}`;

  async function onCopy() {
    try {
      if (draft.kind === "approved") {
        await copyApprovalEmail(draft.firstName, draft.email);
      } else {
        await copyDenialEmail(draft.firstName);
      }
      toast.success("Email copied — paste into your mail app and send");
    } catch {
      toast.error("Could not copy — select the text below manually");
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[1.35rem] border border-teal/25 bg-teal/[0.06] shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-teal/15 px-6 py-5 md:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">
            {draft.kind === "approved" ? "Founding member approval email" : "Denial email (optional)"}
          </p>
          <p className="mt-2 text-sm text-ink/65">
            To:{" "}
            {draft.kind === "approved" ? (
              <span className="font-semibold text-ink">{draft.email}</span>
            ) : (
              <span className="text-ink/50">paste applicant email when sending</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onCopy()}
            className="rounded-full bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-paper shadow-md transition-all hover:-translate-y-0.5 hover:bg-accent"
          >
            Copy email
          </button>
          {"mailto" in content && (
            <a
              href={content.mailto}
              className="rounded-full border-2 border-ink/15 bg-paper px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink/30"
            >
              Open in mail
            </a>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-ink/45 hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto px-6 py-5 text-xs leading-6 text-ink/75 whitespace-pre-wrap md:px-8">
        {fullText}
      </pre>
    </div>
  );
}
