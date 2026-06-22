import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ProfilePhoto } from "@/components/site/ProfilePhoto";
import { getInbox, getMessages, markMessagesRead, sendMessage } from "@/lib/dating.functions";
import { unmatch } from "@/lib/safety.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/messages/$matchId")({
  head: () => ({ meta: [{ title: "Conversation — Anew" }, { name: "robots", content: "noindex" }] }),
  component: ChatPage,
});

const starterIdeas = [
  "Your profile feels thoughtful. What are you most excited about in this chapter?",
  "You seem easy to talk to already. What usually makes a first date feel good to you?",
  "I liked the tone of your profile. What does a great weekend look like for you lately?",
];

function ChatPage() {
  const { matchId } = Route.useParams();
  const { userId } = Route.useRouteContext();
  const fetchMessages = useServerFn(getMessages);
  const fetchInbox = useServerFn(getInbox);
  const doSend = useServerFn(sendMessage);
  const doMarkRead = useServerFn(markMessagesRead);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => fetchMessages({ data: { matchId } }),
  });

  const { data: inboxData } = useQuery({
    queryKey: ["inbox"],
    queryFn: () => fetchInbox(),
  });

  const match = inboxData?.items.find((item) => item.matchId === matchId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  useEffect(() => {
    doMarkRead({ data: { matchId } });
  }, [matchId, doMarkRead]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
          queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => doSend({ data: { matchId, body } }),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    },
  });

  const messages = data?.messages ?? [];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/messages" className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink">
          ← Back to inbox
        </Link>
        <UnmatchButton matchId={matchId} />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
        <div>
          <div className="rounded-[2rem] border border-ink/8 bg-card/88 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)] md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <ProfilePhoto
                path={match?.otherProfile?.primary_photo}
                alt={match?.otherProfile?.first_name ?? "Match"}
                className="h-18 w-18 rounded-[1.2rem] border border-ink/8 object-cover"
                fallbackClassName="flex h-18 w-18 items-center justify-center rounded-[1.2rem] border border-ink/8 bg-muted-warm"
                fallbackInitial={match?.otherProfile?.first_name?.charAt(0).toUpperCase() ?? "?"}
              />
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Conversation
                </p>
                <h1 className="mt-3 font-serif text-4xl leading-tight text-ink">
                  {match?.otherProfile?.first_name ?? "Your match"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/58">
                  Start with something that feels present and specific. A good
                  conversation does not need to be perfect. It just needs to feel real.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-ink/8 bg-paper/88 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/42">
                Quick reminder
              </p>
              <p className="mt-2 text-sm leading-7 text-ink/60">
                The best first messages sound like a person noticing another
                person, not a performance.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-ink/8 bg-paper shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <div className="max-h-[34rem] space-y-5 overflow-y-auto px-5 py-6 md:px-6">
              {isLoading && <p className="text-sm text-ink/50">Loading messages…</p>}

              {!isLoading && messages.length === 0 && (
                <div className="rounded-[1.6rem] border border-dashed border-ink/12 bg-card/88 px-6 py-8 text-center">
                  <p className="font-serif text-2xl leading-tight text-ink">
                    This is the beginning of your conversation.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-ink/56">
                    Start with something simple, warm, and grounded in what
                    made you interested.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {starterIdeas.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => setDraft(idea)}
                        className="rounded-full border border-accent/18 bg-accent/8 px-4 py-2 text-xs text-accent transition-colors hover:border-accent/28 hover:bg-accent/12"
                      >
                        Use this opener
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const isMine = message.sender_id === userId;
                return (
                  <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`rounded-[1.6rem] px-4 py-3 text-sm leading-7 ${
                          isMine
                            ? "bg-ink text-paper"
                            : "border border-ink/10 bg-card/86 text-ink/78"
                        }`}
                      >
                        {message.body}
                      </div>
                      <span className="mt-2 px-1 text-[10px] uppercase tracking-[0.22em] text-ink/38">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-ink/8 bg-card/76 px-5 py-5 md:px-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim() && !sendMutation.isPending) {
                    sendMutation.mutate(draft.trim());
                  }
                }}
                className="space-y-4"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write something kind, specific, and easy to answer…"
                  rows={3}
                  className="w-full rounded-[1.4rem] border border-ink/10 bg-paper px-4 py-3 text-sm leading-7 focus:border-accent focus:outline-none"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-ink/46">
                    Strong openers usually reference a value, a prompt, or something in their chapter.
                  </p>
                  <button
                    type="submit"
                    disabled={sendMutation.isPending || !draft.trim()}
                    className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    {sendMutation.isPending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-ink/8 bg-paper/92 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
              Good conversation cues
            </p>
            <div className="mt-5 space-y-3">
              <CueCard title="Ask one real question">
                Leave room for the other person to answer without pressure.
              </CueCard>
              <CueCard title="Match energy, not intensity">
                Thoughtful beats over-eager almost every time.
              </CueCard>
              <CueCard title="Keep it easy to continue">
                End on something they can naturally reply to.
              </CueCard>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function UnmatchButton({ matchId }: { matchId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unmatchFn = useServerFn(unmatch);
  const [open, setOpen] = useState(false);

  const end = useMutation({
    mutationFn: () => unmatchFn({ data: { matchId } }),
    onSuccess: () => {
      toast.success("Match ended.");
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      navigate({ to: "/matches" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] uppercase tracking-[0.25em] text-ink/50 hover:text-destructive"
      >
        Unmatch
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.8rem] border border-ink/10 bg-paper p-6 shadow-[0_28px_80px_-40px_rgba(25,18,15,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-3xl leading-tight text-ink">End this match?</h3>
            <p className="mt-3 text-sm leading-7 text-ink/58">
              You will both stop seeing each other in matches and messages. This action
              cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] uppercase tracking-[0.25em] text-ink/50 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => end.mutate()}
                disabled={end.isPending}
                className="rounded-full bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
              >
                {end.isPending ? "Ending…" : "Unmatch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CueCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-ink/8 bg-card px-4 py-4">
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-2 text-sm leading-7 text-ink/58">{children}</p>
    </div>
  );
}
