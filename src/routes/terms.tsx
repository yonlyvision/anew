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
        <h2>1. Who we are</h2>
        <p>
          Anew (the &quot;Service&quot;), hosted at connections.inm8tebook.net, is operated by
          LF, Sole Proprietor, Province of Quebec, Canada (&quot;we&quot;,
          &quot;us&quot;). By creating an account you (&quot;Member&quot;) agree to these Terms, our{" "}
          <a href="/disclaimer">Website Disclaimer</a>, our <a href="/privacy">Privacy Policy</a>,
          and our <a href="/community-values">Community Values</a>.
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

        <h2>6. Membership and payments</h2>
        <p>
          Anew is currently free to use, and there is nothing to pay to join or use the Service
          today. We may introduce optional paid plans in the future. If we do, we will show the
          price and terms clearly before you are charged, any paid plan will renew automatically
          until cancelled, and you will be able to cancel at any time from Settings (cancellation
          takes effect at the end of the current billing period, with no partial refunds except
          where required by law).
        </p>

        <h2>7. Suspension and termination</h2>
        <p>
          We may suspend, restrict, or terminate accounts that violate these Terms, our Community
          Values, our Safety policy, or applicable law, with or without notice. You may delete your
          account at any time from Settings.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot;. We do not guarantee matches, outcomes, or the
          conduct of other Members. You are responsible for your own decisions and interactions on
          and off the platform. Important safety limitations — including that we do not conduct
          criminal background checks — are set out in our{" "}
          <a href="/disclaimer">Website Disclaimer</a>, which is incorporated into these Terms by
          reference.
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
