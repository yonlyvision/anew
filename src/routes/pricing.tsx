import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Membership — Anew" },
      {
        name: "description",
        content:
          "Anew is free to join while we grow the community. Premium features are on the way.",
      },
      { property: "og:title", content: "Anew membership" },
      {
        property: "og:description",
        content: "Free to join. Premium features coming soon.",
      },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
    });
  }, []);

  function chooseFree() {
    navigate({ to: signedIn ? "/dashboard" : "/auth" });
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Membership"
        title={<>Free for founding members.</>}
        intro="Anew is completely free while we build the founding community. Everyone who joins now gets full access at no cost — no card required. Premium features may come later, but founding members are how we get there first."
      />
      <section className="mx-auto max-w-md px-6 md:px-8 pb-12">
        <div className="p-10 border border-ink bg-ink text-paper">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-3xl">Free membership</h3>
            <span className="text-sm text-paper/70">$0</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-paper/70">
            Everything you need to join, build a profile, and start making real connections — on
            us, with nothing to pay.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-paper/80">
            {[
              "Create your profile",
              "Upload photos",
              "Browse a curated set of profiles daily",
              "Send likes",
              "Match with mutual likes",
              "Message your matches",
            ].map((f) => (
              <li key={f} className="flex gap-3">
                <span className="text-accent">—</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={chooseFree}
            className="mt-10 w-full py-3 text-xs uppercase tracking-[0.25em] bg-paper text-ink transition-colors hover:bg-accent hover:text-paper"
          >
            Begin free
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-md px-6 md:px-8 pb-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Premium features coming soon</p>
        <p className="mt-3 text-sm text-ink/55 leading-relaxed">
          We're building deeper tools for members down the road. There's nothing to buy today —
          everyone gets full access for free while we grow the community.
        </p>
      </section>
    </SiteLayout>
  );
}
