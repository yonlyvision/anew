import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (active && data) setItems(data as Notification[]);
    };
    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!userId || unread === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
  }

  async function markOneRead(id: string) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="relative text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink"
        aria-label="Notifications"
      >
        Inbox
        {unread > 0 && (
          <span className="absolute -top-2 -right-3 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] tracking-normal text-paper">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 z-50 rounded-md border border-ink/10 bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
              <span className="font-serif text-sm italic">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[10px] uppercase tracking-[0.2em] text-ink/60 hover:text-ink"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-6 text-sm text-ink/50">You're all caught up.</p>
              )}
              {items.map((n) => {
                const dot = !n.read_at;
                const tone =
                  n.kind === "verification_approved"
                    ? "text-emerald-700"
                    : n.kind === "verification_rejected"
                    ? "text-rose-700"
                    : "text-ink/70";
                const inner = (
                  <div className="flex items-start gap-3 px-4 py-3 hover:bg-ink/[0.03] transition-colors">
                    <span
                      className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                        dot ? "bg-ink" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${tone}`}>{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-ink/60 line-clamp-2">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
                const handleClick = () => {
                  markOneRead(n.id);
                  setOpen(false);
                };
                return n.link ? (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={handleClick}
                    className="block border-b border-ink/5 last:border-0"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={handleClick}
                    className="block w-full text-left border-b border-ink/5 last:border-0"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
