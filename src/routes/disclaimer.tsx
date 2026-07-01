import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

const EFFECTIVE_DATE = "June 29, 2026";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Website Disclaimer — Anew / INM8TE Book" },
      {
        name: "description",
        content:
          "Important safety notice, limitations of liability, and terms of use for the Anew platform operated by LF.",
      },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Legal"
        title="Website Disclaimer and Terms of Use Notice"
        intro={
          <>
            Inm8teBook.net / Anew Platform · Operated by LF, Sole
            Proprietor · Province of Quebec, Canada · Effective {EFFECTIVE_DATE}
          </>
        }
      />
      <Prose>
        <p>
          By accessing, browsing, registering for, or using any part of this website or platform,
          you acknowledge that you have read, understood, and agree to be bound by this Disclaimer
          in its entirety. If you do not agree, do not use this platform.
        </p>

        <h2>1. About this platform</h2>
        <p>
          Inm8teBook.net (also operating under the brand name &quot;Anew&quot;, including at{" "}
          <a href="https://connections.inm8tebook.net">connections.inm8tebook.net</a>) is an online
          social networking and dating platform designed to facilitate connections, communication,
          and community among adults. The platform is operated by LF, a sole
          proprietor registered in the Province of Quebec, Canada.
        </p>
        <p>
          The platform is intended for adults who are rebuilding their lives following significant
          life transitions, and for individuals who are open to forming connections with such
          persons. All content, services, and interactions on this platform are provided for social,
          networking, and personal connection purposes only.
        </p>

        <h2>2. No background checks — critical safety notice</h2>
        <p>
          <strong>
            IMPORTANT: Inm8teBook.net does not conduct criminal background checks, sex offender
            registry checks, or any other form of official background screening on any user,
            including users who may have a criminal history of any kind.
          </strong>
        </p>
        <p>By using this platform, you expressly acknowledge and accept that:</p>
        <ul>
          <li>
            Other users of this platform may have criminal records, including convictions for
            violent offences, sexual offences, fraud, or other serious crimes;
          </li>
          <li>
            The platform makes no representation, warranty, or guarantee regarding the criminal
            history, background, intentions, or truthfulness of any user;
          </li>
          <li>
            Verification features (email, phone, photo/selfie) confirm identity elements only — they
            do not constitute a safety endorsement or background clearance;
          </li>
          <li>
            You are solely responsible for conducting your own due diligence, including using
            third-party background check services before meeting any person in person;
          </li>
          <li>
            You assume all risk associated with interactions with other users, both online and
            offline.
          </li>
        </ul>
        <p>If you are not comfortable with the foregoing, you should not use this platform.</p>

        <h2>3. No guarantee of relationships, compatibility, or outcomes</h2>
        <p>Inm8teBook.net does not guarantee:</p>
        <ul>
          <li>The formation of any friendship, romantic relationship, or marriage;</li>
          <li>Compatibility between any users;</li>
          <li>
            The accuracy, honesty, completeness, or currency of any user-provided information or
            profile content;
          </li>
          <li>Any specific outcome, experience, or result from use of the platform.</li>
        </ul>
        <p>
          Users are solely responsible for evaluating the suitability, authenticity, and safety of
          individuals they interact with on this platform.
        </p>

        <h2>4. User responsibilities</h2>
        <p>
          By using this platform, you confirm that you are at least 18 years of age, or the age of
          majority in your jurisdiction, whichever is higher. You further agree to:
        </p>
        <ul>
          <li>
            Take full responsibility for all communications, interactions, and conduct on the
            platform;
          </li>
          <li>Conduct your own independent due diligence before meeting any person in person;</li>
          <li>Protect your personal, financial, and sensitive information at all times;</li>
          <li>Comply with all applicable federal, provincial, and local laws and regulations;</li>
          <li>
            Not use this platform for any unlawful, fraudulent, harassing, threatening, or harmful
            purpose;
          </li>
          <li>
            Immediately report suspicious, abusive, fraudulent, or threatening behaviour to the
            platform administration;
          </li>
          <li>
            Not solicit money, financial assistance, gift cards, cryptocurrency, or any other
            financial instruments from other users.
          </li>
        </ul>

        <h2>5. Safety recommendations</h2>
        <p>
          Given the nature of this platform, users are strongly encouraged to follow these safety
          practices:
        </p>
        <ul>
          <li>
            Use a third-party background check service before agreeing to meet any person in person;
          </li>
          <li>Conduct initial meetings in well-populated public places only;</li>
          <li>
            Inform a trusted friend, family member, or contact of all meeting arrangements, including
            location and timing;
          </li>
          <li>
            Do not share home addresses, financial information, workplace details, or other sensitive
            personal information with users you have not thoroughly vetted;
          </li>
          <li>Be aware that some users may misrepresent their identity, history, or intentions;</li>
          <li>
            Trust your instincts — if any interaction makes you uncomfortable, cease contact and
            report immediately.
          </li>
        </ul>
        <p>
          This platform does not monitor private messages in real time and cannot guarantee your
          safety. Your safety is your responsibility. See also our{" "}
          <Link to="/safety">Safety policy</Link>.
        </p>

        <h2>6. Limitation of liability</h2>
        <p>
          To the fullest extent permitted under the laws of the Province of Quebec and applicable
          federal Canadian law, Inm8teBook.net, its owner LF, and any
          associated contributors, volunteers, moderators, or service providers shall not be liable
          for any:
        </p>
        <ul>
          <li>Direct, indirect, incidental, consequential, special, or punitive damages of any kind;</li>
          <li>
            Physical, emotional, financial, or other harm arising from user interactions, whether
            online or in person;
          </li>
          <li>
            Misrepresentation, fraud, harassment, threats, assault, or criminal conduct by any user;
          </li>
          <li>
            Inaccuracy, incompleteness, or falsity of any user-provided content or profile
            information;
          </li>
          <li>
            Technical interruptions, service outages, security breaches, or unauthorized access to
            user data;
          </li>
          <li>
            Loss of data, loss of revenue, or any other loss arising from use of or inability to use
            the platform.
          </li>
        </ul>
        <p>You access and use this platform entirely at your own risk.</p>

        <h2>7. User-generated content</h2>
        <p>
          All content posted by users — including profiles, photographs, messages, stories, and
          comments — is the sole responsibility of the individual user who posted it. Inm8teBook.net
          does not endorse, verify, guarantee, or take responsibility for any user-generated content.
        </p>
        <p>
          If you believe any content on this platform infringes upon your copyright or the copyright
          of another party, please submit a written notice to{" "}
          <a href="mailto:support@inm8tebook.net">support@inm8tebook.net</a> including:
          identification of the copyrighted work, identification of the infringing content, your
          contact information, and a statement of good faith belief that the use is not authorized.
          We will respond to valid notices in accordance with the Copyright Act (Canada)
          notice-and-notice regime.
        </p>

        <h2>8. Privacy and personal data</h2>
        <p>
          The collection, use, and disclosure of personal information on this platform is governed
          by our <Link to="/privacy">Privacy Policy</Link>, which is incorporated by reference into
          this Disclaimer. By using this platform, you consent to the collection and use of your
          personal information as described in the Privacy Policy.
        </p>
        <p>
          This platform operates in compliance with the Personal Information Protection and
          Electronic Documents Act (PIPEDA) and applicable Quebec privacy legislation. Users have
          the right to access, correct, and request deletion of their personal information. To
          exercise these rights, contact:{" "}
          <a href="mailto:support@inm8tebook.net">support@inm8tebook.net</a>.
        </p>

        <h2>9. No professional advice</h2>
        <p>
          No content on this platform — including articles, stories, wellness information,
          relationship guidance, or educational materials — constitutes legal, medical,
          psychological, financial, or any other form of professional advice. Users should consult
          qualified licensed professionals for guidance on specific personal matters.
        </p>

        <h2>10. Third-party links and services</h2>
        <p>
          This platform may contain links to third-party websites, applications, or services.
          Inm8teBook.net is not responsible for the content, privacy practices, security, or
          accuracy of any third-party site. Links do not constitute endorsement. Users engage with
          third-party services entirely at their own risk.
        </p>

        <h2>11. Modifications to this disclaimer</h2>
        <p>
          Inm8teBook.net reserves the right to modify, update, or replace this Disclaimer at any
          time. Changes take effect upon posting to the website. Continued use of the platform
          following any modification constitutes acceptance of the updated Disclaimer. It is your
          responsibility to review this Disclaimer periodically.
        </p>

        <h2>12. Governing law and jurisdiction</h2>
        <p>
          This Disclaimer and all matters arising from your use of this platform are governed
          exclusively by the laws of the Province of Quebec and the federal laws of Canada
          applicable therein, without regard to conflict of law principles. Any dispute arising
          hereunder shall be subject to the exclusive jurisdiction of the courts of Quebec, Canada.
        </p>

        <h2>Contact information</h2>
        <p>For questions, reports, or legal notices regarding this Disclaimer:</p>
        <ul>
          <li>Platform: Inm8teBook.net / Anew</li>
          <li>Operator: LF, Sole Proprietor</li>
          <li>Province: Quebec, Canada</li>
          <li>
            Email: <a href="mailto:support@inm8tebook.net">support@inm8tebook.net</a>
          </li>
          <li>
            Website:{" "}
            <a href="https://inm8tebook.net" target="_blank" rel="noopener noreferrer">
              https://inm8tebook.net
            </a>
          </li>
        </ul>

        <p className="text-sm text-ink/45 border-t border-ink/10 pt-6 mt-10">
          Effective {EFFECTIVE_DATE}. Related documents:{" "}
          <Link to="/terms">Terms of Service</Link>, <Link to="/privacy">Privacy Policy</Link>,{" "}
          <Link to="/cookies">Cookie Policy</Link>.
        </p>
      </Prose>
    </SiteLayout>
  );
}
