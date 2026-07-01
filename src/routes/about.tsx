import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Anew — Built for second chances" },
      {
        name: "description",
        content:
          "Anew exists for people who believe a person is more than their past. Learn the mission, the values, and who we serve.",
      },
      { property: "og:title", content: "About Anew" },
      {
        property: "og:description",
        content: "A respectful dating community for growth, honesty, and second chances.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Our story" title="About Anew" />
      <Prose>
        <h2>Who we're for</h2>
        <p>
          Most dating apps reward a clean, frictionless story. That leaves out a lot of good people —
          people involved in the justice system who have done the work to change, people in recovery,
          people starting over after a divorce or a loss. You are not the worst thing that happened to
          you. But on most apps, one honest sentence ends the conversation.
        </p>
        <p>
          Anew is a private dating community for two kinds of people: those rebuilding after a hard
          chapter, and those secure enough to meet someone as they are today. The goal isn't to hide
          anyone's past. It's to make sure it's met with a question instead of a verdict.
        </p>

        <h2>What we believe</h2>
        <ul>
          <li>People are more than their record, their diagnosis, or their hardest year.</li>
          <li>You shouldn't have to explain your whole past to a stranger to get a first message.</li>
          <li>Honesty should be rewarded, not punished — on your timing, not forced on day one.</li>
          <li>The biggest green flag is someone who can say "I was wrong" and mean it.</li>
        </ul>

        <h2>How that shows up</h2>
        <ul>
          <li>Profiles lead with who you are now — your values and what you want — not your history.</li>
          <li>We use person-first language and never reduce anyone to a label.</li>
          <li>Verification is real and reviewed by a person, and it's free for everyone.</li>
          <li>You decide what to share, and when. Your story stays yours until you choose to tell it.</li>
        </ul>

        <h2>A note from the founder</h2>
        <div>
          <p>
            I built Anew after watching someone I love get reduced to the worst chapter of their
            life on every app they tried. They were honest about it — and honesty kept ending the
            conversation. But they were one of the most loyal, accountable, genuinely changed
            people I&apos;ve ever known. The apps couldn&apos;t see that. I wanted to build a place
            that could.
          </p>
          <p>
            Anew is small on purpose, and new on purpose. I read the applications. I answer the
            contact form. If you join in these early days, you&apos;re not a user — you&apos;re one
            of the people helping decide what this community feels like. Thank you for being here.
          </p>
          <p className="text-sm text-ink/45">— Anew</p>
        </div>
        <p className="text-sm text-ink/45">
          Anew is a dating community from the INM8TE Book family, hosted at{" "}
          connections.inm8tebook.net.
        </p>
      </Prose>
    </SiteLayout>
  );
}
