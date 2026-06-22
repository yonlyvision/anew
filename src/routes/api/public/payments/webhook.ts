import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import {
  type StripeEnv,
  createStripeClient,
  getWebhookSecret,
} from "@/lib/stripe.server";

type DbTier = "free" | "monthly" | "three_month" | "six_month" | "yearly";

function tierFromPriceId(priceId: string | null | undefined): DbTier {
  switch (priceId) {
    case "premium_monthly":
      return "monthly";
    case "premium_3mo":
      return "three_month";
    case "premium_6mo":
      return "six_month";
    case "premium_yearly":
      return "yearly";
    default:
      return "free";
  }
}

type DbSubStatus = "active" | "cancelled" | "expired" | "pending";

function mapStatus(s: Stripe.Subscription.Status): DbSubStatus {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "incomplete":
    case "paused":
      return "pending";
    case "canceled":
    case "unpaid":
      return "cancelled";
    case "incomplete_expired":
      return "expired";
    default:
      return "pending";
  }
}

async function upsertSubscription(
  env: StripeEnv,
  sub: Stripe.Subscription,
  stripe: ReturnType<typeof createStripeClient>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const customer = await stripe.customers.retrieve(customerId);
  const userId =
    !("deleted" in customer) ? (customer.metadata?.userId as string | undefined) : undefined;
  if (!userId) return;

  const item = sub.items.data[0];
  const stripePrice = item?.price;
  // Resolve human-readable price id via lookup_key
  const priceId = stripePrice?.lookup_key ?? null;
  const productId =
    typeof stripePrice?.product === "string"
      ? stripePrice.product
      : stripePrice?.product?.id ?? null;

  const periodEnd = (item as { current_period_end?: number } | undefined)?.current_period_end;

  const row = {
    user_id: userId,
    tier: tierFromPriceId(priceId),
    status: mapStatus(sub.status),
    price_id: priceId,
    product_id: productId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  // upsert by (stripe_subscription_id, environment)
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("subscriptions").insert(row);
  }

  // Only true active subscriptions grant premium. past_due / incomplete / paused
  // should not unlock features. Canceled-with-grace stays premium until period end
  // (status will be 'cancelled' here but current_period_end may be in the future);
  // we honour that via a separate check.
  const now = new Date();
  const periodEndDate = row.current_period_end ? new Date(row.current_period_end) : null;
  const inGrace =
    row.status === "cancelled" && periodEndDate !== null && periodEndDate > now;
  const premium = row.tier !== "free" && (row.status === "active" || inGrace);
  await supabaseAdmin.from("profiles").update({ is_premium: premium }).eq("id", userId);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const envParam = url.searchParams.get("env");
        const env: StripeEnv = envParam === "live" ? "live" : "sandbox";

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const stripe = createStripeClient(env);
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            getWebhookSecret(env),
          );
        } catch (err) {
          return new Response(
            `Invalid signature: ${err instanceof Error ? err.message : "unknown"}`,
            { status: 400 },
          );
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode === "subscription" && session.subscription) {
                const subId =
                  typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                await upsertSubscription(env, sub, stripe);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              await upsertSubscription(env, event.data.object as Stripe.Subscription, stripe);
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("[webhook] handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
