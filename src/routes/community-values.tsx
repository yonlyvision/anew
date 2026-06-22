import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/community-values")({
  head: () => ({
    meta: [
      { title: "Community values — The Anew code" },
      {
        name: "description",
        content:
          "Honesty, respect, accountability, safety, growth, and real connection. The values that shape life inside Anew.",
      },
      { property: "og:title", content: "Community values" },
      {
        property: "og:description",
        content: "The six values that shape every conversation inside Anew.",
      },
    ],
  }),
  component: Values,
});

const values = [
  { t: "Honesty", d: "Be truthful about who you are and what you are looking for. Honesty is the foundation of every connection here." },
  { t: "Respect", d: "No harassment, humiliation, judgement, or abuse. We hold each other to the standard of grown-up kindness." },
  { t: "Accountability", d: "A second chance is not a free pass. It is the mature acceptance of who you were, who you are, and who you are becoming." },
  { t: "Safety", d: "We protect each other from scams, harassment, and harmful behaviour — and we report it when we see it." },
  { t: "Growth", d: "We support the people who are doing the hard, slow work of becoming better. Stronger. More stable." },
  { t: "Real connection", d: "The goal is not the match. The goal is the person, the conversation, and the relationship that comes from both." },
] as const;

function Values() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="The Anew code"
        title={<>Six values. Lived daily.</>}
        intro="These are not slogans. They shape moderation decisions, profile guidance, and every conversation we hold with the community."
      />
      <section className="mx-auto max-w-5xl px-6 md:px-8 pb-32 grid md:grid-cols-2 gap-12 md:gap-16">
        {values.map((v, i) => (
          <div key={v.t} className="space-y-4">
            <p className="font-serif italic text-xl text-ink/30">0{i + 1}</p>
            <div className="w-10 h-px bg-accent" />
            <h2 className="font-serif text-3xl">{v.t}</h2>
            <p className="text-ink/70 leading-relaxed">{v.d}</p>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
