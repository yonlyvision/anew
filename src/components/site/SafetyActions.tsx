import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { blockUser, reportUser, unmatch } from "@/lib/safety.functions";

const REASONS = [
  "Fake or misleading profile",
  "Inappropriate photos",
  "Harassment or abuse",
  "Scam or spam",
  "Underage user",
  "Off-platform request",
  "Other",
];

export function SafetyActions({
  targetUserId,
  matchId,
  onAfterBlock,
}: {
  targetUserId: string;
  matchId?: string;
  onAfterBlock?: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reportFn = useServerFn(reportUser);
  const blockFn = useServerFn(blockUser);
  const unmatchFn = useServerFn(unmatch);

  const [open, setOpen] = useState<null | "report" | "block" | "unmatch">(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  const report = useMutation({
    mutationFn: () =>
      reportFn({ data: { reportedId: targetUserId, reason, details: details || undefined } }),
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it.");
      setOpen(null);
      setDetails("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const block = useMutation({
    mutationFn: () => blockFn({ data: { blockedId: targetUserId } }),
    onSuccess: () => {
      toast.success("Blocked. They can no longer contact you.");
      qc.invalidateQueries({ queryKey: ["discover"] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      setOpen(null);
      onAfterBlock?.();
      navigate({ to: "/discover" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const end = useMutation({
    mutationFn: () => {
      if (!matchId) throw new Error("No match");
      return unmatchFn({ data: { matchId } });
    },
    onSuccess: () => {
      toast.success("Match ended.");
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      setOpen(null);
      navigate({ to: "/matches" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
        {matchId && (
          <button
            type="button"
            onClick={() => setOpen("unmatch")}
            className="border border-ink/20 px-3 py-1.5 text-ink/60 hover:border-ink hover:text-ink"
          >
            Unmatch
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen("report")}
          className="border border-ink/20 px-3 py-1.5 text-ink/60 hover:border-ink hover:text-ink"
        >
          Report
        </button>
        <button
          type="button"
          onClick={() => setOpen("block")}
          className="border border-destructive/40 px-3 py-1.5 text-destructive hover:bg-destructive hover:text-paper"
        >
          Block
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md bg-paper p-6 border border-ink/10" onClick={(e) => e.stopPropagation()}>
            {open === "report" && (
              <>
                <h3 className="font-serif text-xl">Report this member</h3>
                <p className="mt-2 text-sm text-ink/60">
                  Help us keep Anew safe. Reports are confidential.
                </p>
                <label className="mt-4 block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">Reason</span>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">Details (optional)</span>
                  <textarea
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={2000}
                    className="w-full border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </label>
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setOpen(null)} className="text-[11px] uppercase tracking-[0.25em] text-ink/50 hover:text-ink">
                    Cancel
                  </button>
                  <button
                    onClick={() => report.mutate()}
                    disabled={report.isPending}
                    className="bg-ink px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-paper hover:bg-accent disabled:opacity-60"
                  >
                    Submit report
                  </button>
                </div>
              </>
            )}

            {open === "block" && (
              <>
                <h3 className="font-serif text-xl">Block this member?</h3>
                <p className="mt-2 text-sm text-ink/60">
                  They won't be able to see your profile, like you, or message you. Any active match will end.
                </p>
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setOpen(null)} className="text-[11px] uppercase tracking-[0.25em] text-ink/50 hover:text-ink">
                    Cancel
                  </button>
                  <button
                    onClick={() => block.mutate()}
                    disabled={block.isPending}
                    className="bg-destructive px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-paper hover:opacity-90 disabled:opacity-60"
                  >
                    Block
                  </button>
                </div>
              </>
            )}

            {open === "unmatch" && (
              <>
                <h3 className="font-serif text-xl">End this match?</h3>
                <p className="mt-2 text-sm text-ink/60">
                  You'll both stop seeing each other in matches and messages. This can't be undone.
                </p>
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setOpen(null)} className="text-[11px] uppercase tracking-[0.25em] text-ink/50 hover:text-ink">
                    Cancel
                  </button>
                  <button
                    onClick={() => end.mutate()}
                    disabled={end.isPending}
                    className="bg-ink px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-paper hover:bg-accent disabled:opacity-60"
                  >
                    Unmatch
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
