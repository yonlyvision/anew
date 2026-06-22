import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";
import { posts } from "./index";

const bodies: Record<string, Array<{ h?: string; p?: string }>> = {
  "dating-when-starting-over": [
    { p: "Starting over is not a single moment. It is a long, quiet morning that lasts months — sometimes years. You wake up, you make coffee, and somewhere between the first sip and the second you realize: the life you had no longer exists, and the life ahead has not arrived." },
    { p: "Dating, in that morning, can feel almost absurd. How do you sit across from a stranger and pretend small talk matters when you are still re-learning your own name?" },
    { h: "Begin smaller than you think" },
    { p: "Do not start with romance. Start with company. A walk. A short coffee with no expectations of a second one. The goal is not to find someone. The goal is to remember what it feels like to be seen by another person who has no history with you." },
    { h: "Tell the truth in small sentences" },
    { p: "You do not owe anyone your whole story on the first date. You also do not owe anyone a polished version of it. Pick one true sentence about where you are right now — \"I am rebuilding\", \"I am dating slowly on purpose\", \"I am not the person I was five years ago\" — and let that be enough for now." },
    { h: "Let pace be a value, not a flaw" },
    { p: "If someone is impatient with the speed at which you trust, they are telling you something useful. Receive it without arguing. The right person will find your pace beautiful." },
    { h: "Notice what you bring, not just what you lost" },
    { p: "You came through something. That is a kind of fluency in life that few people have. Honor it. The work you have done on yourself is not a footnote — it is a chapter the right person will want to read." },
  ],
  "building-trust-slowly": [
    { p: "Trust is not announced. It accumulates. It is the sum of small, repeated proofs that someone's words and someone's life are in agreement." },
    { h: "Trust is built in calendars, not in conversations" },
    { p: "Anyone can promise. Look at the calendar instead. Did they show up when they said they would? Did they call back? Did the second week look like the first? Trust is a pattern, and patterns need time to appear." },
    { h: "Watch how they treat low-stakes moments" },
    { p: "The way someone handles a small inconvenience — a late train, a forgotten reservation — tells you more about who they will be in a crisis than any deep conversation." },
    { h: "Share inconvenient truths early" },
    { p: "The hard things you do not share become the hard things that find you anyway, six months in, with much higher stakes. Quiet honesty, offered early, builds the kind of trust that can hold weight later." },
    { h: "Receive trust gracefully" },
    { p: "When someone offers you trust, do not immediately try to justify it. Just hold it. Let it land. Then go and prove it slowly, the way you would want to be proven to." },
  ],
  "when-to-share-your-past": [
    { p: "There is no universal answer to when you share your past. There is only your honesty, their pace, and the kindness that lives between them." },
    { h: "Not on the first message. Not in the bio. Not as a test." },
    { p: "Putting your hardest chapter on a profile is a way of protecting yourself from rejection by guaranteeing it. Save the depth for someone who has earned the right to hear it — usually after a few real conversations." },
    { h: "Before it would feel like a betrayal not to" },
    { p: "If you can feel the moment approaching where withholding would start to feel like hiding, that is the moment. Choose a quiet time. Tell the truth in your own words, in your own voice. You are not asking permission. You are offering trust." },
    { h: "Frame the present, not just the past" },
    { p: "\"This is what happened. This is what I learned. This is who I am now and how I live.\" The past is context. The present is the offer." },
    { h: "Their first reaction is not their final answer" },
    { p: "Give people room to be human. Some need a day to sit with what you shared. The conversation that matters is the one you have a week later, not the one you have in the first ten minutes." },
  ],
  "past-versus-pattern": [
    { p: "A past is a chapter. A pattern is a sentence we are still writing. Knowing the difference is one of the most useful skills in second-chance dating — for the person sharing, and for the person listening." },
    { h: "A past has an ending" },
    { p: "It has a date. It has consequences someone has faced. It is followed by a clear, ongoing change in behavior, relationships, and self-understanding. When someone talks about a past, you can feel the distance in the room." },
    { h: "A pattern keeps repeating" },
    { p: "It has different names but the same shape. It is described in the passive voice — things that keep happening to them. The reflection is shallow, the apologies are familiar, the next time always begins the same way." },
    { h: "What to look for, on either side of the table" },
    { p: "Specificity. Ownership. Time elapsed. New behavior under similar pressure. The willingness to be uncomfortable about the past without performing shame about it." },
    { h: "Be honest about your own" },
    { p: "If you find a pattern of your own when you look closely, you are not disqualified from love. You are invited to work on it. The work is the difference." },
  ],
  "what-second-chance-dating-means": [
    { p: "Second-chance dating is sometimes mistaken for lower standards. It is the opposite. It is higher standards, applied to a different question." },
    { h: "Not: who has the cleanest past?" },
    { p: "Instead: who has done the work? Who tells the truth about themselves? Who shows up the same way on a Tuesday as on a Saturday? Who can sit in a hard conversation without flinching?" },
    { h: "It rewards depth over polish" },
    { p: "The most compelling people on Anew are not the ones with the most perfect lives. They are the ones who can describe their lives accurately and still choose to love." },
    { h: "It is for everyone" },
    { p: "Second-chance dating is not only for people with a hard chapter. It is also for the open-hearted partners who would rather meet someone real than someone curated. The two find each other here." },
  ],
  "red-flags-green-flags": [
    { h: "Green: They tell the same story twice the same way" },
    { p: "Consistency across weeks is the simplest test of honesty. The truth does not need to be rehearsed." },
    { h: "Green: They are specific about what they are working on" },
    { p: "Not \"I am working on myself.\" Instead: the actual practice, the actual person they call, the actual thing they no longer do." },
    { h: "Green: They listen as well as they talk" },
    { p: "They remember what you said last time. They ask about it. The conversation goes in both directions." },
    { h: "Green: Pace feels mutual" },
    { p: "Neither of you is dragging the other forward. Trust accumulates at a rate that feels safe to both of you." },
    { h: "Green: Their friends and family exist" },
    { p: "Not visible publicly — visible to you, over time, in the rhythm of their life." },
    { h: "Green: They handle small frustrations gracefully" },
    { p: "A delayed train, a misunderstood text. The small moments tell the truth." },
    { h: "Red: \"Everyone from my past was crazy\"" },
    { p: "The common factor in every previous relationship is them. A person who cannot find any responsibility in their own story will not find it in yours either." },
    { h: "Red: Pressure to skip stages" },
    { p: "Premature intensity is rarely about you. It is about something they are running from." },
    { h: "Red: Hostility toward your pace" },
    { p: "If your reasonable boundaries trigger contempt, that is a preview, not a phase." },
    { h: "Red: A gap between words and calendar" },
    { p: "What they say they will do, what they actually do, and how often the two agree — over weeks, not days." },
  ],
};

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = posts.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Anew Journal` },
          { name: "description", content: loaderData.excerpt },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.excerpt },
          { property: "og:type", content: "article" },
        ]
      : [],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="text-sm text-ink/60">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-32 text-center space-y-6">
        <h1 className="font-serif text-4xl">Essay not found</h1>
        <Link to="/blog" className="inline-block text-[11px] uppercase tracking-[0.25em] text-accent">
          Return to the journal →
        </Link>
      </div>
    </SiteLayout>
  ),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();
  const body = bodies[post.slug] ?? [
    { p: "This essay is being written. Check back soon." },
  ];
  return (
    <SiteLayout>
      <PageHero eyebrow={post.category} title={post.title} intro={post.excerpt} />
      <Prose>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink/40">{post.date}</p>
        {body.map((block, i) =>
          block.h ? (
            <h2 key={i}>{block.h}</h2>
          ) : (
            <p key={i}>{block.p}</p>
          )
        )}
        <hr className="border-ink/10 my-12" />
        <p className="text-sm text-ink/60">
          <Link to="/blog">← Back to the journal</Link>
          {" · "}
          <Link to="/success-stories">Read member stories</Link>
        </p>
      </Prose>
    </SiteLayout>
  );
}
