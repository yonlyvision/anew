import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const { isActive, refetch } = useSubscription(userId);

  // Webhook arrives async — poll for ~15s while waiting for activation.
  useEffect(() => {
    if (!session_id || !userId || isActive) return;
    const interval = setInterval(() => refetch(), 1500);
    const stop = setTimeout(() => clearInterval(interval), 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [session_id, userId, isActive, refetch]);

  const heading = !session_id
    ? "Checkout"
    : isActive
      ? "Welcome to Premium."
      : "Activating your membership…";

  const body = !session_id
    ? "No checkout session found."
    : isActive
      ? "Your membership is live. Enjoy unlimited likes and your Premium badge."
      : "Your payment was received. We're finalising things — this usually takes a few seconds.";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-serif text-4xl mb-6">{heading}</h1>
        <p className="text-ink/70 mb-10">{body}</p>
        <Link
          to="/dashboard"
          className="inline-block bg-ink text-paper px-8 py-3 text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors"
        >
          Go to dashboard
        </Link>
      </section>
    </SiteLayout>
  );
}
