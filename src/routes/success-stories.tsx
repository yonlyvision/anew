import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Stories we're building toward — Anew" },
      {
        name: "description",
        content:
          "The kinds of honest, slow-built connection Anew is designed to support.",
      },
      { property: "og:title", content: "Stories we're building toward" },
      {
        property: "og:description",
        content: "The kind of connection Anew is built to support.",
      },
    ],
  }),
  component: Stories,
});

// Illustrative examples — replace with consented member stories when available.
const stories = [
  {
    quote:
      "Someone who wants to understand who I am now — not just what I've been through.",
  },
  {
    quote:
      "Being open to dating someone with a harder road than mine, and finding out how much that openness gives back.",
  },
  {
    quote:
      "Months of long messages and real questions before meeting in person — so that the first date feels like meeting an old friend.",
  },
  {
    quote:
      "Telling someone about your past and being met with a question instead of a verdict.",
  },
] as const;

function Stories() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="What we're building"
        title={<>Stories we're building toward.</>}
        intro="These are the kinds of connection Anew is designed to make room for — honest, slow-built, and worth the wait."
      />
      <section className="mx-auto max-w-4xl px-6 md:px-8 pb-32 space-y-16">
        {stories.map((s, i) => (
          <figure key={i} className="border-t border-ink/10 pt-12">
            <blockquote className="font-serif italic text-2xl md:text-3xl text-ink/85 leading-snug text-pretty">
              "{s.quote}"
            </blockquote>
          </figure>
        ))}
      </section>
    </SiteLayout>
  );
}
