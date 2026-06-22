import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  listMembers,
  setMemberPause,
  setMemberRole,
} from "@/lib/admin.functions";
import {
  adminBanMember,
  adminDeleteMember,
  adminGrantPremium,
  adminSetMemberNotes,
} from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({
    meta: [{ title: "Members — Anew Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminMembers,
});

function AdminMembers() {
  const listFn = useServerFn(listMembers);
  const pauseFn = useServerFn(setMemberPause);
  const roleFn = useServerFn(setMemberRole);
  const banFn = useServerFn(adminBanMember);
  const deleteFn = useServerFn(adminDeleteMember);
  const premiumFn = useServerFn(adminGrantPremium);
  const notesFn = useServerFn(adminSetMemberNotes);
  const qc = useQueryClient();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members", active],
    queryFn: () => listFn({ data: { query: active, limit: 50 } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "members"] });

  const pause = useMutation({
    mutationFn: (vars: { userId: string; paused: boolean }) => pauseFn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const role = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "moderator"; grant: boolean }) =>
      roleFn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Forbidden"),
  });

  const ban = useMutation({
    mutationFn: (vars: { userId: string; banned: boolean }) => banFn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("Ban status updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId, confirm: "DELETE" } }),
    onSuccess: () => {
      invalidate();
      toast.success("Account deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const premium = useMutation({
    mutationFn: (vars: { userId: string; premium: boolean }) => premiumFn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("Premium updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const notes = useMutation({
    mutationFn: (vars: { userId: string; notes: string }) => notesFn({ data: vars }),
    onSuccess: () => toast.success("Notes saved"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Members</h1>
      <p className="mt-3 text-ink/60">Search, moderate, ban, and manage subscriptions.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActive(query);
        }}
        className="mt-8 flex gap-3 max-w-xl"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, country"
          className="flex-1 border border-ink/20 bg-paper p-3 text-sm focus:outline-none focus:border-ink"
        />
        <button className="border border-ink bg-ink text-paper px-5 text-[11px] uppercase tracking-[0.25em]">
          Search
        </button>
      </form>

      <div className="mt-10 border border-ink/10">
        {isLoading ? (
          <p className="p-8 text-sm text-ink/50">Loading…</p>
        ) : (data?.items ?? []).length === 0 ? (
          <p className="p-8 text-sm text-ink/50 italic">No members match.</p>
        ) : (
          <div className="divide-y divide-ink/10">
            {(data?.items ?? []).map((m: {
              id: string;
              first_name: string | null;
              city: string | null;
              country: string | null;
              roles: string[];
              is_premium: boolean;
              is_paused: boolean;
              is_banned?: boolean;
              email_verified: boolean;
              phone_verified: boolean;
              selfie_verified: boolean;
              onboarding_completed: boolean;
              created_at: string;
              admin_notes?: string | null;
            }) => (
              <div key={m.id} className="p-5 md:p-6 space-y-4">
                <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p className="font-serif text-xl">{m.first_name || "Unnamed"}</p>
                      {m.roles.includes("admin") && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-accent">Admin</span>
                      )}
                      {m.roles.includes("moderator") && !m.roles.includes("admin") && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-accent">Moderator</span>
                      )}
                      {m.is_premium && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gold">Premium</span>
                      )}
                      {m.is_paused && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-rose-700">Paused</span>
                      )}
                      {m.is_banned && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-destructive">Banned</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink/60">
                      {[m.city, m.country].filter(Boolean).join(", ") || "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-ink/40 flex flex-wrap gap-3">
                      <span>email {m.email_verified ? "✓" : "·"}</span>
                      <span>phone {m.phone_verified ? "✓" : "·"}</span>
                      <span>selfie {m.selfie_verified ? "✓" : "·"}</span>
                      <span>onboarded {m.onboarding_completed ? "✓" : "·"}</span>
                      <span>joined {new Date(m.created_at).toLocaleDateString()}</span>
                    </p>
                    <p className="mt-1 text-[10px] text-ink/30 font-mono break-all">{m.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end text-[11px] uppercase tracking-[0.2em]">
                    <button
                      onClick={() => pause.mutate({ userId: m.id, paused: !m.is_paused })}
                      className="border border-ink/30 px-3 py-2 hover:border-ink"
                    >
                      {m.is_paused ? "Unpause" : "Pause"}
                    </button>
                    <button
                      onClick={() => ban.mutate({ userId: m.id, banned: !m.is_banned })}
                      className="border border-destructive/40 px-3 py-2 text-destructive hover:border-destructive"
                    >
                      {m.is_banned ? "Unban" : "Ban"}
                    </button>
                    <button
                      onClick={() =>
                        premium.mutate({ userId: m.id, premium: !m.is_premium })
                      }
                      className="border border-gold/40 px-3 py-2 hover:border-gold"
                    >
                      {m.is_premium ? "Revoke premium" : "Grant premium"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Permanently delete this account and all data?")) {
                          del.mutate(m.id);
                        }
                      }}
                      className="border border-destructive/30 px-3 py-2 hover:border-destructive"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() =>
                        role.mutate({
                          userId: m.id,
                          role: "moderator",
                          grant: !m.roles.includes("moderator"),
                        })
                      }
                      className="border border-ink/30 px-3 py-2 hover:border-ink"
                    >
                      {m.roles.includes("moderator") ? "Revoke mod" : "Make mod"}
                    </button>
                    <button
                      onClick={() =>
                        role.mutate({
                          userId: m.id,
                          role: "admin",
                          grant: !m.roles.includes("admin"),
                        })
                      }
                      className="border border-ink/30 px-3 py-2 hover:border-ink"
                    >
                      {m.roles.includes("admin") ? "Revoke admin" : "Make admin"}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-ink/45">
                    Internal notes
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={m.admin_notes ?? ""}
                    onChange={(e) =>
                      setNotesDraft((d) => ({ ...d, [m.id]: e.target.value }))
                    }
                    className="w-full border border-ink/15 bg-paper p-3 text-sm"
                    placeholder="Moderator notes (internal only)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      notes.mutate({
                        userId: m.id,
                        notes: notesDraft[m.id] ?? m.admin_notes ?? "",
                      })
                    }
                    className="text-[10px] uppercase tracking-[0.2em] text-accent hover:text-ink"
                  >
                    Save notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
