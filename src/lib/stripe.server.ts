import Stripe from 'stripe';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = 'sandbox' | 'live';

// Direct Stripe secret keys (sk_test_… for sandbox, sk_live_… for live).
export function getStripeSecretKey(env: StripeEnv): string {
  return env === 'sandbox'
    ? getEnv('STRIPE_SANDBOX_API_KEY')
    : getEnv('STRIPE_LIVE_API_KEY');
}

export function getWebhookSecret(env: StripeEnv): string {
  return env === 'sandbox'
    ? getEnv('PAYMENTS_SANDBOX_WEBHOOK_SECRET')
    : getEnv('PAYMENTS_LIVE_WEBHOOK_SECRET');
}

export function createStripeClient(env: StripeEnv): Stripe {
  // Talk to Stripe's API directly. (Previously routed through Lovable's
  // connector gateway; now self-hosted, so we use the account's own keys.)
  return new Stripe(getStripeSecretKey(env));
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; raw?: { message?: string } };
    return e.raw?.message ?? e.message ?? 'Stripe request failed';
  }
  return 'Stripe request failed';
}
