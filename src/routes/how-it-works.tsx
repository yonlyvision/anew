import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Anew works — A quiet path to connection" },
      {
        name: "description",
        content:
          "Seven steps from joining to building real trust. Anew is a private dating community built for honest connection between adults.",
      },
      { property: "og:title", content: "How Anew works" },
      {
        property: "og:description",
        content: "From application to first conversation — the slow, intentional Anew process.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    n: "01",
    t: "Create an account",
    d: "Sign up with your basics — name, email, age, and location. We never publish profiles to search engines.",
  },
  {
    n: "02",
    t: "Build your profile",
    d: "Photos, a short bio, your interests, your values, what you are looking for. The 'New Chapter' section is yours to write on your own terms.",
  },
  {
    n: "03",
    t: "Verify your account",
    d: "Email and phone verification first. Selfie verification adds a verified badge. Optional identity review is available for members who want extra trust signals.",
  },
  {
    n: "04",
    t: "Discover open-minded people",
    d: "Browse profiles filtered by who you are and what you want. We use respectful language — never labels that reduce someone to their past.",
  },
  {
    n: "05",
    t: "Like and match",
    d: "Like the profiles that move you. When two people both like each other, the conversation opens.",
  },
  {
    n: "06",
    t: "Message safely",
    d: "Private, encrypted messaging with one-tap report, block, and unmatch. Safety reminders surface where they matter.",
  },
  {
    n: "07",
    t: "Build trust over time",
    d: "Move at your own pace. Anew exists to support relationships that grow slowly, honestly, and with respect.",
  },
] as const;

function HowItWorks() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="The journey"
        title={<>How Anew works.</>}
        intro="A quieter, more intentional path to meeting someone. We focus on the people you become — not the speed at which you swipe."
      />
      <section className="mx-auto max-w-5xl px-6 md:px-8 pb-32 space-y-16">
        {steps.map((s) => (
          <div key={s.n} className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12 items-start">
            <div>
              <p className="font-serif italic text-3xl text-ink/30">{s.n}</p>
              <div className="w-10 h-px bg-accent mt-4" />
            </div>
            <div className="space-y-3">
              <h2 className="font-serif text-3xl">{s.t}</h2>
              <p className="text-ink/70 leading-relaxed max-w-prose">{s.d}</p>
            </div>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
