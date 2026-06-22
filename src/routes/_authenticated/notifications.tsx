import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Anew" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

type N = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function NotificationsPage() {
  const { userId } = Route.useRouteContext();
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("notifications")
      .select("id,kind,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data as N[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markAll() {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
  }

  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
  }

  const unread = items.filter((i) => !i.read_at).length;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Inbox</span>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight">Notifications</h1>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="mt-12 border border-ink/10">
        {loading && <p className="px-6 py-10 text-sm text-ink/50">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="px-6 py-10 text-sm text-ink/50">You're all caught up.</p>
        )}
        {items.map((n) => {
          const inner = (
            <div className="flex items-start gap-4 px-6 py-5">
              <span
                className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                  n.read_at ? "bg-transparent" : "bg-ink"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-ink">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-ink/60">{n.body}</p>}
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(n.id);
                }}
                className="text-[10px] uppercase tracking-[0.2em] text-ink/40 hover:text-destructive"
              >
                Delete
              </button>
            </div>
          );
          return n.link ? (
            <Link key={n.id} to={n.link} className="block border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]">
              {inner}
            </Link>
          ) : (
            <div key={n.id} className="border-b border-ink/5 last:border-0">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
