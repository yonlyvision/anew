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
  { t: "Honesty", d: "Say who you are and what you want. No performance, no bait-and-switch." },
  { t: "Respect", d: "No harassment, humiliation, or cruelty. Disagree like an adult." },
  { t: "Accountability", d: "A second chance isn't a free pass. Own your past and your choices today." },
  { t: "Safety", d: "Report scams, harassment, and pressure for money. We review reports by hand." },
  { t: "Growth", d: "We show up for people doing the slow work of change — not people coasting on promises." },
  { t: "Real connection", d: "The point isn't a match count. It's a real conversation with a real person." },
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
