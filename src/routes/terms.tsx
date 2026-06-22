import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Anew" },
      { name: "description", content: "The terms that govern membership and use of Anew." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHero eyebrow="Legal" title="Terms & Conditions" intro="Last updated June 3, 2026" />
      <Prose>
        <p className="text-sm text-ink/50">
          This is a working template. Have it reviewed by a lawyer in your jurisdiction before
          launch.
        </p>

        <h2>1. Who we are</h2>
        <p>
          Anew (the "Service") is operated by Anew Ltd ("we", "us"). By creating an account you
          ("Member") agree to these Terms and to our <a href="/privacy">Privacy Policy</a> and{" "}
          <a href="/community-values">Community Values</a>.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old, legally able to enter a contract, and not barred from
          using the Service under applicable law. One account per person. Accounts are personal and
          non-transferable.
        </p>

        <h2>3. Membership and conduct</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information and photographs of yourself.</li>
          <li>
            Treat every Member with respect and follow our Community Values and Safety policies.
          </li>
          <li>
            Never harass, threaten, defraud, impersonate, or solicit money, gifts, or financial
            help from any Member.
          </li>
          <li>Not share another person's private information or images without consent.</li>
          <li>Not use the Service for commercial, political, or illegal activity.</li>
        </ul>

        <h2>4. Verification</h2>
        <p>
          To protect the community we may require email, phone, or selfie verification. You consent
          to us comparing your selfie to your profile photos for the sole purpose of confirming
          identity. Verification data is stored securely and never shared publicly.
        </p>

        <h2>5. Content</h2>
        <p>
          You retain ownership of the photos, text, and information you upload ("Member Content").
          You grant us a worldwide, royalty-free licence to host, display, and reproduce Member
          Content solely to operate and improve the Service. You can delete Member Content at any
          time from Settings.
        </p>

        <h2>6. Subscriptions and payments</h2>
        <p>
          Some features are available only with a paid plan. Paid plans renew automatically at the
          end of each billing period until cancelled. You can cancel at any time from Settings;
          cancellation takes effect at the end of the current billing period and no partial refunds
          are issued except where required by law.
        </p>

        <h2>7. Suspension and termination</h2>
        <p>
          We may suspend, restrict, or terminate accounts that violate these Terms, our Community
          Values, our Safety policy, or applicable law, with or without notice. You may delete your
          account at any time from Settings.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          The Service is provided "as is". We do not guarantee matches, outcomes, or the conduct of
          other Members. You are responsible for your own decisions and interactions on and off the
          platform.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, our aggregate liability for any claim relating to
          the Service is limited to the amount you paid to us in the 12 months preceding the claim.
          We are not liable for indirect or consequential losses.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update these Terms from time to time. Material changes will be communicated by
          email or in-app notice at least 14 days before they take effect.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions about these Terms? Reach us via <a href="/contact">our contact form</a>.
        </p>
      </Prose>
    </SiteLayout>
  ),
});
