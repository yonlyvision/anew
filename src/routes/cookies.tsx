import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Prose, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Anew" },
      { name: "description", content: "How Anew uses cookies and similar technologies." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <PageHero eyebrow="Legal" title="Cookie Policy" intro="Last updated June 3, 2026" />
      <Prose>
        <p className="text-sm text-ink/50">
          This is a working template. Have it reviewed by a lawyer in your jurisdiction before
          launch.
        </p>

        <h2>What are cookies?</h2>
        <p>
          Cookies are small text files that websites place on your device. We use cookies and
          similar technologies (such as local storage) to operate Anew, remember your preferences,
          and understand how the Service is used.
        </p>

        <h2>Essential cookies</h2>
        <p>
          These are required for the Service to function. They keep you signed in, remember your
          basic preferences, and protect against fraud and abuse. The Service will not work without
          them.
        </p>

        <h2>Analytics cookies</h2>
        <p>
          We use privacy-respecting analytics to understand aggregate product usage. We do not
          build advertising profiles and we do not share this data with advertisers.
        </p>

        <h2>No third-party advertising</h2>
        <p>
          We do not place advertising cookies and we do not allow third-party advertising networks
          on Anew.
        </p>

        <h2>Your choices</h2>
        <p>
          You can manage or block cookies via your browser settings. Disabling essential cookies
          will prevent you from signing in or using core features.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Reach us via <a href="/contact">our contact form</a>.
        </p>
      </Prose>
    </SiteLayout>
  ),
});
