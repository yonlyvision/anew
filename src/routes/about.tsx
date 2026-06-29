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
      <PageHero
        eyebrow="Our story"
        title={<>For people the apps weren't built for.</>}
        intro="If you've rebuilt your life after something hard — time away, recovery, a divorce, a season you'd rather not lead with — you already know how fast people decide who you are. Anew is for you, and for the people open to knowing you before they judge you."
      />
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
        <div className="rounded-2xl border border-dashed border-accent/25 bg-accent/[0.04] px-5 py-4 not-prose">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Client note — before launch
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/55">
            Founder name and photo will be supplied by the client. Once we have them, we&apos;ll add
            the portrait and signature here. The letter below stays as-is until then.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start">
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-ink/[0.03] text-center text-xs leading-5 text-ink/40"
            aria-hidden="true"
          >
            Founder photo
            <br />
            (coming)
          </div>
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
            <p className="text-sm text-ink/45">
              — [Founder name from client], Anew
            </p>
          </div>
        </div>
        <p className="text-sm text-ink/45">
          Anew is a dating community from the INM8TE Book family, hosted at{" "}
          connections.inm8tebook.net.
        </p>
      </Prose>
    </SiteLayout>
  );
}
