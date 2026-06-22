import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety at Anew — Privacy, verification, and care" },
      {
        name: "description",
        content:
          "Anew's safety commitment: verified identities, encrypted messaging, human moderators, and clear reporting and blocking tools.",
      },
      { property: "og:title", content: "Safety at Anew" },
      {
        property: "og:description",
        content: "Verified, private, and proactively moderated. Your safety is our foundation.",
      },
    ],
  }),
  component: Safety,
});

function Safety() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Trust & safety"
        title={<>Safety, as a <em>standard</em>.</>}
        intro="Your safety, privacy, and peace of mind matter. We build Anew with tools that protect members and encourage respectful connection."
      />
      <Prose>
        <h2>Verification</h2>
        <ul>
          <li>Email verification at sign-up.</li>
          <li>Phone verification before messaging.</li>
          <li>Selfie verification for a verified badge.</li>
          <li>Optional identity review for members who want extra trust signals.</li>
        </ul>

        <h2>Reporting tools</h2>
        <p>You can report another member for any of the following:</p>
        <ul>
          <li>Harassment or threats</li>
          <li>Fake profile or scam behaviour</li>
          <li>Requests for money</li>
          <li>Inappropriate content</li>
          <li>Disrespectful or judgemental behaviour</li>
          <li>Anything that feels unsafe</li>
        </ul>

        <h2>Blocking</h2>
        <p>
          You can block anyone at any time. Once blocked, that person cannot message you, view your
          profile, or interact with you anywhere on Anew.
        </p>

        <h2>Messaging safety</h2>
        <ul>
          <li>One-tap report and block inside every conversation.</li>
          <li>Unmatch at any time, no explanation needed.</li>
          <li>Quiet safety reminders at moments that matter.</li>
        </ul>

        <h2>Dating safety tips</h2>
        <ul>
          <li>Meet in public the first few times.</li>
          <li>Tell a trusted friend where you are going.</li>
          <li>Move slowly — pace is a form of self-respect.</li>
          <li>Never send money, no matter how compelling the story.</li>
          <li>Trust actions, not words.</li>
          <li>Report anything that feels off. We review every report.</li>
        </ul>

        <h2>Privacy promise</h2>
        <p>
          You control what you share and when you share it. Profiles are not indexed by search engines.
          Your personal details are encrypted. Your story is yours to tell — in your own words, at your
          own pace.
        </p>
      </Prose>
    </SiteLayout>
  );
}
