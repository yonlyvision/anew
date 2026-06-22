
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

GRANT ALL ON public.subscriptions TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_env_unique
  ON public.subscriptions (stripe_subscription_id, environment)
  WHERE stripe_subscription_id IS NOT NULL;
