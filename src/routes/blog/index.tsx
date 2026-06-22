import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "The Anew Journal — Essays on second chances and connection" },
      {
        name: "description",
        content:
          "Honest writing on dating after a hard chapter, building trust slowly, and what real second-chance love looks like.",
      },
      { property: "og:title", content: "The Anew Journal" },
      {
        property: "og:description",
        content: "Essays on dating, honesty, rebuilding, and second chances.",
      },
    ],
  }),
  component: BlogList,
});

export const posts = [
  {
    slug: "dating-when-starting-over",
    category: "Rebuilding life",
    title: "How to date again when you are starting over",
    excerpt:
      "The first conversation, the first coffee, the first time you tell someone who you are now — and who you used to be.",
    date: "May 2026",
  },
  {
    slug: "building-trust-slowly",
    category: "Dating with honesty",
    title: "How to build trust slowly in a new relationship",
    excerpt:
      "Trust is not a switch. It is a series of small, repeated choices that prove your words match your life.",
    date: "April 2026",
  },
  {
    slug: "when-to-share-your-past",
    category: "Dating with honesty",
    title: "When should you share your past with someone?",
    excerpt:
      "There is no universal answer. There is your honesty, their pace, and the kindness that lives between them.",
    date: "April 2026",
  },
  {
    slug: "past-versus-pattern",
    category: "Second chance stories",
    title: "The difference between a past and a pattern",
    excerpt: "A past is a chapter. A pattern is a sentence we are still writing. Here is how to tell them apart.",
    date: "March 2026",
  },
  {
    slug: "what-second-chance-dating-means",
    category: "Second chance stories",
    title: "What second-chance dating actually means",
    excerpt: "It is not lower standards. It is higher standards, applied to a different question.",
    date: "March 2026",
  },
  {
    slug: "red-flags-green-flags",
    category: "Safety & boundaries",
    title: "Red flags and green flags in second-chance dating",
    excerpt: "Six signs someone is doing the work — and four signs they are still pretending to.",
    date: "February 2026",
  },
] as const;

function BlogList() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="The journal"
        title={<>Honest writing on <em>becoming</em>.</>}
        intro="Essays on dating after a hard chapter, building trust slowly, and what real second-chance love looks like."
      />
      <section className="mx-auto max-w-5xl px-6 md:px-8 pb-32 divide-y divide-ink/10">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group grid md:grid-cols-[180px_1fr_auto] gap-4 md:gap-12 py-10 hover:bg-ink/[0.015] transition-colors items-baseline"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold">
              {p.category}
            </span>
            <div className="space-y-3">
              <h2 className="font-serif text-2xl md:text-3xl group-hover:text-accent transition-colors">
                {p.title}
              </h2>
              <p className="text-ink/60 leading-relaxed max-w-prose">{p.excerpt}</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40 md:text-right">
              {p.date}
            </span>
          </Link>
        ))}
      </section>
    </SiteLayout>
  );
}
