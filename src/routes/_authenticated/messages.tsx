import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";

import { ProfilePhoto } from "@/components/site/ProfilePhoto";
import { getInbox } from "@/lib/dating.functions";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — Anew" }, { name: "robots", content: "noindex" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const fetchInbox = useServerFn(getInbox);

  const { data, isLoading } = useQuery({
    queryKey: ["inbox"],
    queryFn: () => fetchInbox(),
  });

  const items = data?.items ?? [];
  const unreadTotal = items.reduce((count, item) => count + item.unreadCount, 0);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Inbox
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-6xl">
            Conversations should feel calm from the start.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
            This space is for the people who already liked each other. Lead with
            warmth, stay curious, and let the profile context do some of the
            work before the first line ever lands.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard label="Active chats" value={String(items.length)}>
              Matches that have moved into conversation.
            </MetricCard>
            <MetricCard label="Unread" value={String(unreadTotal)}>
              Messages still waiting for your attention.
            </MetricCard>
            <MetricCard label="Best practice" value="Warm">
              The strongest openers reference something real from the profile.
            </MetricCard>
          </div>

          {isLoading && <p className="mt-10 text-sm text-ink/50">Loading…</p>}

          {!isLoading && items.length === 0 && (
            <div className="mt-10 rounded-[2rem] border border-ink/8 bg-card/88 px-8 py-10 text-center shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
              <p className="font-serif text-3xl leading-tight text-ink">No conversations yet.</p>
              <p className="mt-3 text-sm leading-7 text-ink/56">
                When a like becomes mutual, your conversation begins here. The
                calmer your profile feels, the easier this part tends to become.
              </p>
              <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-paper transition-colors hover:bg-accent"
                >
                  Discover people
                </Link>
                <Link
                  to="/profile/edit"
                  className="inline-flex items-center justify-center rounded-full border border-ink/12 px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-ink/68 transition-colors hover:border-ink hover:text-ink"
                >
                  Refine profile
                </Link>
              </div>
            </div>
          )}

          <div className="mt-10 space-y-4">
            {items.map((item) => (
              <InboxRow key={item.matchId} item={item} />
            ))}
          </div>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-ink/8 bg-paper/92 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
              Better openers
            </p>
            <div className="mt-5 space-y-3">
              <GuidanceCard title="Reference something specific">
                Values, a prompt, or a detail from their chapter is better than
                “hey” every time.
              </GuidanceCard>
              <GuidanceCard title="Keep the first line light">
                Curiosity works better than over-performing or trying too hard
                to impress.
              </GuidanceCard>
              <GuidanceCard title="Match the tone">
                If their profile feels thoughtful and grounded, let your message
                feel that way too.
              </GuidanceCard>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function InboxRow({
  item,
}: {
  item: {
    matchId: string;
    otherId: string;
    otherProfile:
      | {
          id: string;
          first_name: string | null;
          primary_photo: string | null;
          primary_photo_url?: string | null;
        }
      | null;
    createdAt: string;
    lastMessage: { body: string; createdAt: string; isMine: boolean } | null;
    unreadCount: number;
  };
}) {
  const profile = item.otherProfile;

  return (
    <Link
      to={`/messages/${item.matchId}`}
      className="group flex items-center gap-4 rounded-[1.8rem] border border-ink/8 bg-paper/92 p-4 shadow-[0_18px_50px_-44px_rgba(32,24,20,0.45)] transition-colors hover:border-ink/18"
    >
      <div className="shrink-0">
        <ProfilePhoto
          path={profile?.primary_photo}
          alt=""
          className="h-16 w-16 rounded-[1.1rem] object-cover border border-ink/8"
          fallbackClassName="flex h-16 w-16 items-center justify-center rounded-[1.1rem] border border-ink/8 bg-muted-warm"
          fallbackInitial={profile?.first_name?.charAt(0).toUpperCase() ?? "?"}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-serif text-2xl leading-none text-ink">
            {profile?.first_name ?? "Member"}
          </span>
          {item.unreadCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-ink px-2 py-1 text-[10px] font-semibold text-paper">
              {item.unreadCount}
            </span>
          )}
        </div>
        {item.lastMessage ? (
          <p className="mt-2 truncate text-sm leading-7 text-ink/58">
            {item.lastMessage.isMine ? "You: " : ""}
            {item.lastMessage.body}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-7 text-ink/46 italic">
            No messages yet. This is a good place to start with warmth.
          </p>
        )}
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
          {new Date(item.lastMessage?.createdAt ?? item.createdAt).toLocaleDateString()}
        </p>
        <p className="mt-2 text-xs text-ink/46">{item.unreadCount > 0 ? "Unread" : "Seen"}</p>
      </div>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-ink/8 bg-paper/88 px-5 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/44">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl leading-none text-ink">{value}</p>
      <p className="mt-3 text-sm leading-7 text-ink/58">{children}</p>
    </div>
  );
}

function GuidanceCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-ink/8 bg-card px-4 py-4">
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-2 text-sm leading-7 text-ink/58">{children}</p>
    </div>
  );
}
