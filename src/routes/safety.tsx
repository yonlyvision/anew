import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety at Anew — Privacy, verification, and care" },
      {
        name: "description",
        content:
          "Anew's safety commitment: verified identities, private messaging, reports reviewed by a real person, and clear reporting and blocking tools.",
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
        <h2>What verification does — and does not — mean</h2>
        <p>
          Verification confirms that someone controls an email, phone number, or looks like their
          photos. It is <strong>not</strong> a background check and it is not a safety clearance. We
          do not run criminal background checks or sex offender registry checks on members. Please read
          our full <a href="/disclaimer">Website Disclaimer</a> before meeting anyone in person, and
          consider using a third-party background check service if that matters to you.
        </p>

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

        <h2>How we handle reports</h2>
        <p>
          Every report is reviewed by a real person — not just an automated filter. We aim to review
          reports within 24 hours. While a report is being reviewed, we may limit or suspend the
          reported account's ability to message other members.
        </p>

        <h2>Blocking</h2>
        <p>
          You can block anyone at any time. Once blocked, that person cannot message you, view your
          profile, or interact with you anywhere on Anew. Blocking takes effect immediately.
        </p>

        <h2>Requests for money</h2>
        <p>
          Asking other members for money, gift cards, or financial help is strictly against our
          rules. If you receive a request like this, report it — accounts that solicit money can be
          suspended or removed. We will never ask you to send money to another member.
        </p>

        <h2>Messaging safety</h2>
        <ul>
          <li>One-tap report and block inside every conversation.</li>
          <li>Unmatch at any time, no explanation needed.</li>
          <li>Quiet safety reminders at moments that matter.</li>
        </ul>

        <h2>Dating safety tips</h2>
        <ul>
          <li>Consider a third-party background check before meeting in person.</li>
          <li>Meet in public the first few times.</li>
          <li>Tell a trusted friend where you are going.</li>
          <li>Move slowly — pace is a form of self-respect.</li>
          <li>Never send money, no matter how compelling the story.</li>
          <li>Trust actions, not words.</li>
          <li>Report anything that feels off. We review every report.</li>
        </ul>

        <h2>Privacy promise</h2>
        <p>
          You control what you share and when you share it. Profiles are not indexed by search
          engines, and we never show your profile to anyone who is not signed in. Your data is
          protected with encryption in transit (HTTPS/TLS) and at rest. Messaging is private between
          you and your match; note that messages are not end-to-end encrypted, so our team can
          access them when needed to investigate a report or keep the community safe. Your story is
          yours to tell — in your own words, at your own pace.
        </p>

        <h2>On the roadmap</h2>
        <p>
          We're actively building more safety tools. These are not live yet, and we'll only announce
          them here once they are:
        </p>
        <ul>
          <li>Share your date details with a trusted contact.</li>
          <li>Automatic detection and blurring of explicit images.</li>
          <li>Automated flagging of messages that request money.</li>
        </ul>
      </Prose>
    </SiteLayout>
  );
}
