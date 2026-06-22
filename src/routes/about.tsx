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
        title={<>A place built for <em>becoming</em>.</>}
        intro="Anew was created for the people too often misjudged at first glance — and for the open-hearted partners willing to know them slowly, honestly, and without labels."
      />
      <Prose>
        <h2>Our mission</h2>
        <p>
          We believe that people are more than their past. Anew is a private dating community built to
          help adults create honest, respectful, and meaningful connections while beginning a new chapter
          in life.
        </p>

        <h2>Why this platform exists</h2>
        <p>
          Many people feel judged or rejected because of one chapter of their life — a difficult job, a
          court date, a divorce, an addiction they have moved past, a season of grief. The mainstream
          dating apps were not built for these stories. Anew is.
        </p>
        <p>
          We exist to give people a respectful space to meet others who believe in growth, accountability,
          and second chances.
        </p>

        <h2>What makes Anew different</h2>
        <ul>
          <li>Profiles centre on values and the present, not on labels or history.</li>
          <li>Verification is rigorous and human-reviewed.</li>
          <li>Language across the platform is mature, dignified, and respectful.</li>
          <li>Moderation is proactive, not reactive.</li>
          <li>The pace is slow, intentional, and emotionally grown-up.</li>
        </ul>

        <h2>Who Anew is for</h2>
        <ul>
          <li>People rebuilding their life after a difficult chapter.</li>
          <li>People looking for honest connection rather than performance.</li>
          <li>Open-minded partners who value emotional maturity over a perfect past.</li>
          <li>Adults who believe trust is earned slowly and that growth is the point.</li>
        </ul>
      </Prose>
    </SiteLayout>
  );
}
