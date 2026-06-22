import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { PaymentTestModeBanner } from "@/components/site/PaymentTestModeBanner";
import { StripeCheckout } from "@/components/site/StripeCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Membership — Anew" },
      {
        name: "description",
        content:
          "A free plan to get started, and a Premium plan for members who want full visibility, unlimited likes, and a verified badge.",
      },
      { property: "og:title", content: "Anew membership" },
      {
        property: "og:description",
        content: "Free and Premium plans for the Anew community.",
      },
    ],
  }),
  component: Pricing,
});

const PLANS = [
  { id: "premium_monthly", label: "Monthly", price: "$24 / month" },
  { id: "premium_3mo", label: "3 months", price: "$60 — $20/mo" },
  { id: "premium_6mo", label: "6 months", price: "$108 — $18/mo" },
  { id: "premium_yearly", label: "12 months", price: "$180 — $15/mo" },
];

function Pricing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [, setBusy] = useState(false);
  const { isActive } = useSubscription(userId);
  const portalFn = useServerFn(createPortalSession);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setUserId(data.user?.id);
    });
  }, []);

  function chooseFree() {
    navigate({ to: signedIn ? "/dashboard" : "/auth" });
  }
  async function choosePremium(priceId: string) {
    if (!signedIn) {
      navigate({ to: "/auth", search: { redirect: "/pricing" } });
      return;
    }
    if (isActive) {
      // Already subscribed — send to Stripe portal to change/cancel plan.
      setBusy(true);
      try {
        const result = await portalFn({
          data: {
            environment: getStripeEnvironment(),
            returnUrl: `${window.location.origin}/settings`,
          },
        });
        if ("error" in result) throw new Error(result.error);
        window.open(result.url, "_blank");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't open billing portal");
      } finally {
        setBusy(false);
      }
      return;
    }
    setActivePrice(priceId);
  }

  return (
    <SiteLayout>
      <PaymentTestModeBanner />
      <PageHero
        eyebrow="Membership"
        title={<>Two ways to belong.</>}
        intro="Anew is free to join. Premium adds the tools members ask us for most: full visibility, unlimited reach, and a verified badge that travels with you."
      />
      <section className="mx-auto max-w-5xl px-6 md:px-8 pb-24 grid md:grid-cols-2 gap-8">
        <Plan
          name="Free"
          price="—"
          desc="Everything you need to join, build a profile, and make your first matches."
          features={[
            "Create your profile",
            "Upload photos",
            "Browse a curated set of profiles daily",
            "Send a limited number of likes",
            "Match with mutual likes",
            "Receive messages from your matches",
          ]}
          cta="Begin free"
          onCta={chooseFree}
        />
        <Plan
          name="Premium"
          price="From $15/mo"
          desc="For members who want full visibility, unlimited reach, and the deeper tools."
          features={[
            "Unlimited likes",
            "See who has liked your profile",
            "Advanced search filters",
            "Priority profile placement",
            "Read receipts",
            "Profile boost & spotlight",
            "Premium verified badge",
          ]}
          cta="Choose Premium"
          onCta={() => choosePremium("premium_monthly")}
          highlight
        />
      </section>

      <section className="mx-auto max-w-4xl px-6 md:px-8 pb-32">
        <h2 className="font-serif text-3xl mb-8">Premium plans</h2>
        <ul className="divide-y divide-ink/10 text-ink/70">
          {PLANS.map((p) => (
            <li key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
              <div>
                <div className="font-medium text-ink">{p.label}</div>
                <div className="text-sm text-ink/60">{p.price}</div>
              </div>
              <button
                type="button"
                onClick={() => choosePremium(p.id)}
                className="self-start sm:self-auto border border-ink px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-paper"
              >
                Select
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink/50">
          Cancel any time. All plans renew automatically until cancelled. See our{" "}
          <Link to="/terms" className="text-accent underline-offset-4 hover:underline">
            subscription terms
          </Link>
          .
        </p>
      </section>

      <Dialog open={!!activePrice} onOpenChange={(o) => !o && setActivePrice(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-serif text-2xl">Complete your membership</DialogTitle>
          </DialogHeader>
          <div className="p-2 sm:p-4">
            {activePrice ? (
              <StripeCheckout
                priceId={activePrice}
                returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

function Plan({
  name,
  price,
  desc,
  features,
  cta,
  onCta,
  highlight,
}: {
  name: string;
  price: string;
  desc: string;
  features: string[];
  cta: string;
  onCta: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-10 border ${
        highlight ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-3xl">{name}</h3>
        <span className={`text-sm ${highlight ? "text-paper/70" : "text-ink/50"}`}>{price}</span>
      </div>
      <p className={`mt-4 text-sm leading-relaxed ${highlight ? "text-paper/70" : "text-ink/60"}`}>
        {desc}
      </p>
      <ul className={`mt-8 space-y-3 text-sm ${highlight ? "text-paper/80" : "text-ink/70"}`}>
        {features.map((f) => (
          <li key={f} className="flex gap-3">
            <span className="text-accent">—</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCta}
        className={`mt-10 w-full py-3 text-xs uppercase tracking-[0.25em] transition-colors ${
          highlight
            ? "bg-paper text-ink hover:bg-accent hover:text-paper"
            : "border border-ink text-ink hover:bg-ink hover:text-paper"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}
