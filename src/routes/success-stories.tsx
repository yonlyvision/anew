import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Stories we're building toward — Anew" },
      {
        name: "description",
        content:
          "Illustrative examples of the kind of honest, slow-built connection Anew is designed to support. We're a new community — these are the moments we hope to make room for.",
      },
      { property: "og:title", content: "Stories we're building toward" },
      {
        property: "og:description",
        content: "Illustrative examples of the connection Anew is built to support.",
      },
    ],
  }),
  component: Stories,
});

// NOTE: Anew is a new community. These are illustrative examples — not
// testimonials from real members — written to show the kind of connection the
// platform is designed to support. They are intentionally labelled as such to
// stay honest and compliant with FTC/consumer-protection rules on testimonials.
// Replace with real, consented member stories once we have them.
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
        intro="Anew is just getting started, so we're not going to fake a wall of testimonials. Instead, here's the kind of connection this community is designed to make room for. When real members are ready to share their own stories — with their consent — they'll live here."
      />
      <section className="mx-auto max-w-4xl px-6 md:px-8 pb-16 space-y-16">
        {stories.map((s, i) => (
          <figure key={i} className="border-t border-ink/10 pt-12">
            <blockquote className="font-serif italic text-2xl md:text-3xl text-ink/85 leading-snug text-pretty">
              "{s.quote}"
            </blockquote>
          </figure>
        ))}
      </section>
      <section className="mx-auto max-w-4xl px-6 md:px-8 pb-32">
        <p className="rounded-2xl border border-ink/10 bg-muted-warm px-5 py-4 text-sm leading-7 text-ink/55">
          These are illustrative examples of experiences Anew aims to support, not
          testimonials from real members. We'll only publish real stories here with the explicit
          consent of the people they belong to.
        </p>
      </section>
    </SiteLayout>
  );
}
