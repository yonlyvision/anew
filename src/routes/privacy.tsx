import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Anew" },
      {
        name: "description",
        content: "How Anew collects, stores, and protects your personal information.",
      },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHero eyebrow="Legal" title="Privacy Policy" intro="Last updated June 3, 2026" />
      <Prose>
        <p className="text-sm text-ink/50">
          This is a working template. Have it reviewed by a privacy lawyer in your jurisdiction
          before launch.
        </p>

        <h2>Our promise</h2>
        <p>
          Your privacy is the foundation of trust on Anew. We collect the minimum information
          needed to run a safe community, we never sell your data, and we never let search engines
          index member profiles.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> name, date of birth, email, phone number, password hash.
          </li>
          <li>
            <strong>Profile content:</strong> photos, bio, interests, values, relationship goal,
            and the answers you choose to share.
          </li>
          <li>
            <strong>Verification data:</strong> selfie images, ID documents (only if you choose to
            verify), retained encrypted and used only to confirm identity.
          </li>
          <li>
            <strong>Activity data:</strong> likes, matches, messages, reports, and basic usage
            telemetry needed to operate and secure the Service.
          </li>
          <li>
            <strong>Device data:</strong> IP address, device type, and browser, used for security
            and fraud prevention.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To operate the platform and show you potential matches.</li>
          <li>To keep the community safe (moderation, verification, abuse prevention).</li>
          <li>To send service-related notifications (matches, messages, status updates).</li>
          <li>To improve the product based on aggregated, de-identified usage.</li>
          <li>To comply with legal obligations and respond to lawful requests.</li>
        </ul>

        <h2>What we never do</h2>
        <ul>
          <li>We do not sell or rent your personal data.</li>
          <li>We do not allow search engines to index your member profile.</li>
          <li>We do not show your photos or profile to anyone who is not signed in.</li>
          <li>We do not share your data for third-party advertising.</li>
        </ul>

        <h2>Sharing</h2>
        <p>
          We share data only with trusted infrastructure providers who help us run the Service
          (hosting, email, analytics), under strict contractual privacy obligations. We may
          disclose information if required by law or to protect the safety of our community.
        </p>

        <h2>Retention</h2>
        <p>
          We keep account data while your account is active. When you delete your account, profile
          content is removed within 30 days; we retain minimal records (e.g. abuse logs) only where
          legally required.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, you have rights to access, correct, export, restrict, or
          delete your personal data. You can exercise most rights directly from Settings, or by
          contacting us. We respond within 30 days.
        </p>

        <h2>International transfers</h2>
        <p>
          Where data is transferred outside your country, we rely on standard contractual clauses
          or other lawful mechanisms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests? Reach our privacy team via <a href="/contact">our contact form</a>.
        </p>
      </Prose>
    </SiteLayout>
  ),
});
