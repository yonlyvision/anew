import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Stories from Anew members — Anonymous and real" },
      {
        name: "description",
        content:
          "Anonymous stories from Anew members about second chances, slow trust, and the relationships that grew from them.",
      },
      { property: "og:title", content: "Stories from Anew members" },
      {
        property: "og:description",
        content: "Anonymous, real stories of second-chance connection.",
      },
    ],
  }),
  component: Stories,
});

const stories = [
  {
    quote:
      "After years of feeling judged, I finally met someone who wanted to understand who I was becoming, not only what I had been through.",
    meta: "Member, two years sober — 2025",
  },
  {
    quote:
      "I joined Anew because I was open to dating someone who had a harder road than mine. I never expected to fall for the most emotionally mature person I have ever known.",
    meta: "Open-minded member — 2024",
  },
  {
    quote:
      "We took six months before meeting in person. Six months of long messages, real questions, no games. The day we finally met, it felt like meeting an old friend.",
    meta: "Couple, now engaged — 2025",
  },
  {
    quote:
      "He told me about his past on the third call. I asked what he had learned. We talked for four hours. We are still talking, two years later.",
    meta: "Member — 2024",
  },
] as const;

function Stories() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="From our members"
        title={<>The quiet wins.</>}
        intro="Stories shared anonymously by Anew members. Names and identifying details are always omitted to protect privacy."
      />
      <section className="mx-auto max-w-4xl px-6 md:px-8 pb-32 space-y-16">
        {stories.map((s, i) => (
          <figure key={i} className="border-t border-ink/10 pt-12">
            <blockquote className="font-serif italic text-2xl md:text-3xl text-ink/85 leading-snug text-pretty">
              "{s.quote}"
            </blockquote>
            <figcaption className="mt-8 text-[10px] uppercase tracking-[0.3em] text-ink/40 font-semibold">
              — {s.meta}
            </figcaption>
          </figure>
        ))}
      </section>
    </SiteLayout>
  );
}
