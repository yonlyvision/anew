import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { listAuditLog } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [{ title: "Audit log — Anew Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAudit,
});

function AdminAudit() {
  const fn = useServerFn(listAuditLog);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit", actionFilter],
    queryFn: () => fn({ data: { action: actionFilter || undefined, limit: 500 } }),
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Audit log</h1>
      <p className="mt-3 text-ink/60">Forensic trail of admin and moderator actions.</p>

      <div className="mt-8 max-w-sm">
        <input
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. ban_member)"
          className="w-full border border-ink/20 bg-paper p-3 text-sm"
        />
      </div>

      <div className="mt-8 border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-ink/10 text-left text-[10px] uppercase tracking-[0.2em] text-ink/45">
              <th className="p-4">When</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-ink/50">
                  Loading…
                </td>
              </tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-ink/50 italic">
                  No entries yet.
                </td>
              </tr>
            ) : (
              (data?.items ?? []).map((row: {
                id: string;
                created_at: string;
                actorName: string | null;
                action: string;
                target_type: string | null;
                target_id: string | null;
                payload: Record<string, unknown>;
              }) => (
                <tr key={row.id} className="border-b border-ink/5">
                  <td className="p-4 text-ink/55 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">{row.actorName ?? "Staff"}</td>
                  <td className="p-4 font-mono text-xs">{row.action}</td>
                  <td className="p-4 text-ink/60">
                    {row.target_type ?? "—"}
                    {row.target_id ? (
                      <span className="block text-[10px] font-mono text-ink/35 truncate max-w-[200px]">
                        {row.target_id}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
