import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  getReportConversation,
  listReports,
  updateReport,
  warnReportedUser,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [{ title: "Reports — Anew Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminReports,
});

const STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;

function AdminReports() {
  const fn = useServerFn(listReports);
  const upd = useServerFn(updateReport);
  const convFn = useServerFn(getReportConversation);
  const warnFn = useServerFn(warnReportedUser);
  const qc = useQueryClient();

  const [openReport, setOpenReport] = useState<{
    id: string;
    reporter_id: string;
    reported_id: string;
    reportedName: string | null;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => fn(),
  });

  const { data: conversation, isLoading: convLoading } = useQuery({
    queryKey: ["admin", "report-conv", openReport?.reporter_id, openReport?.reported_id],
    queryFn: () =>
      convFn({
        data: {
          reporterId: openReport!.reporter_id,
          reportedId: openReport!.reported_id,
        },
      }),
    enabled: !!openReport,
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: (typeof STATUSES)[number] }) => upd({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const warn = useMutation({
    mutationFn: (userId: string) =>
      warnFn({
        data: {
          userId,
          message:
            "A member report about your activity was reviewed. Please review our community guidelines.",
        },
      }),
    onSuccess: () => toast.success("Warning sent"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Reports</h1>
      <p className="mt-3 text-ink/60">Review reports with full conversation context.</p>

      <div className="mt-10 space-y-4">
        {isLoading ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : (data?.items ?? []).length === 0 ? (
          <p className="text-sm text-ink/50 italic">No reports.</p>
        ) : (
          (data?.items ?? []).map((r: {
            id: string;
            reporter_id: string;
            reported_id: string;
            reporterName: string | null;
            reportedName: string | null;
            reason: string;
            details: string | null;
            status: string;
            created_at: string;
          }) => (
            <div key={r.id} className="border border-ink/10 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{r.reason}</p>
                  <p className="mt-1 font-serif text-xl">
                    {r.reporterName || "Someone"} → {r.reportedName || "member"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenReport({
                        id: r.id,
                        reporter_id: r.reporter_id,
                        reported_id: r.reported_id,
                        reportedName: r.reportedName,
                      })
                    }
                    className="text-[11px] uppercase tracking-[0.25em] text-teal hover:text-ink"
                  >
                    View conversation
                  </button>
                  <Link
                    to="/profile/$userId"
                    params={{ userId: r.reported_id }}
                    className="text-[11px] uppercase tracking-[0.25em] text-accent"
                  >
                    Profile →
                  </Link>
                </div>
              </div>
              {r.details ? (
                <p className="mt-3 text-sm text-ink/70 whitespace-pre-wrap">{r.details}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => mut.mutate({ id: r.id, status: s })}
                    className={`border px-3 py-1.5 ${
                      r.status === s
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/30 hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => warn.mutate(r.reported_id)}
                  className="border border-ink/30 px-3 py-1.5 hover:border-ink ml-auto"
                >
                  Warn user
                </button>
                <span className="text-ink/40 normal-case tracking-normal text-[11px]">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {openReport && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-ink/10 bg-paper shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-ink/10 p-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-ink/45">Conversation</p>
              <p className="font-serif text-lg">{openReport.reportedName ?? "Member"}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpenReport(null)}
              className="text-ink/50 hover:text-ink text-xl"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {convLoading ? (
              <p className="text-sm text-ink/50">Loading messages…</p>
            ) : !conversation?.matchId ? (
              <p className="text-sm text-ink/50 italic">No active match between these members.</p>
            ) : (conversation.messages ?? []).length === 0 ? (
              <p className="text-sm text-ink/50 italic">Match exists but no messages yet.</p>
            ) : (
              conversation.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl p-3 text-sm ${
                    m.sender_id === openReport.reporter_id
                      ? "bg-muted-warm ml-0 mr-8"
                      : "bg-coral/10 ml-8 mr-0"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1">
                    {m.sender_id === openReport.reporter_id ? "Reporter" : "Reported"}
                  </p>
                  <p className="text-ink/80 whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-[10px] text-ink/35">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
