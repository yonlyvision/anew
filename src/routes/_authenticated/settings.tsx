import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { setProfilePaused, deleteOwnAccount } from "@/lib/profile.functions";
import { createPortalSession } from "@/lib/payments.functions";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Anew" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const pauseFn = useServerFn(setProfilePaused);
  const deleteFn = useServerFn(deleteOwnAccount);
  const portalFn = useServerFn(createPortalSession);
  const { subscription, isActive } = useSubscription(userId);

  const [email, setEmail] = useState("");
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: profile }, { data: userData }] = await Promise.all([
        supabase.from("profiles").select("is_paused").eq("id", userId).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      setPaused(!!profile?.is_paused);
      setEmail(userData.user?.email ?? "");
      setLoading(false);
    })();
  }, [userId]);

  async function togglePause() {
    setBusy(true);
    try {
      await pauseFn({ data: { paused: !paused } });
      setPaused(!paused);
      toast.success(!paused ? "Profile paused" : "Profile is live again");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    if (!email.trim()) {
      toast.error("Enter your email");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent");
  }

  async function deleteAccount() {
    if (confirmDel !== "DELETE") {
      toast.error('Type DELETE to confirm');
      return;
    }
    setBusy(true);
    try {
      await deleteFn({ data: { confirm: "DELETE" } });
      await supabase.auth.signOut();
      toast.success("Account deleted");
      if (typeof window !== "undefined") window.location.assign("/");
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-6 py-20"><p className="text-sm text-ink/50">Loading…</p></div>;
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Account</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">Settings</h1>

      <div className="mt-12 space-y-8">
        <Card title="Password">
          <p className="text-sm text-ink/60">Send a reset link to your email.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink"
            />
            <button
              type="button"
              onClick={sendReset}
              className="bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-paper hover:bg-accent"
            >
              Send reset link
            </button>
          </div>
        </Card>

        <Card title="Pause profile">
          <p className="text-sm text-ink/60">
            Pausing hides you from Discover. Matches and messages stay available.
          </p>
          <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-sm text-ink/70">
              Status: <span className="font-medium">{paused ? "Paused" : "Live"}</span>
            </span>
            <button
              type="button"
              onClick={togglePause}
              disabled={busy}
              className="border border-ink px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-paper disabled:opacity-50"
            >
              {paused ? "Unpause" : "Pause"}
            </button>
          </div>
        </Card>

        <Card title="Membership">
          <p className="text-sm text-ink/60">
            {isActive
              ? `Premium — ${tierLabel(subscription?.tier)}. ${
                  subscription?.cancel_at_period_end
                    ? "Cancels at period end."
                    : "Renews automatically."
                }`
              : "You're on the Free plan."}
          </p>
          <div className="flex gap-3 pt-2">
            {isActive ? (
              <button
                type="button"
                onClick={async () => {
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
                    toast.error(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                className="border border-ink px-5 py-2 text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-paper disabled:opacity-50"
              >
                Manage billing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate({ to: "/pricing" })}
                className="bg-ink px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-paper hover:bg-accent"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </Card>

        <Card title="Blocked members">
          <p className="text-sm text-ink/60">
            Manage members you've blocked from your profile and messages.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/settings/blocks" })}
            className="mt-2 text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink"
          >
            View block list →
          </button>
        </Card>

        <Card title="Delete account" tone="danger">
          <p className="text-sm text-ink/60">
            This removes your profile, photos, likes, matches and messages. It cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <input
              type="text"
              value={confirmDel}
              onChange={(e) => setConfirmDel(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="flex-1 border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-destructive"
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={busy || confirmDel !== "DELETE"}
              className="bg-destructive px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-paper hover:opacity-90 disabled:opacity-40"
            >
              Delete account
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

const TIER_LABELS: Record<string, string> = {
  monthly: "Monthly",
  three_month: "3 months",
  six_month: "6 months",
  yearly: "12 months",
};
function tierLabel(tier: string | null | undefined): string {
  if (!tier) return "Premium";
  return TIER_LABELS[tier] ?? tier;
}

function Card({ title, tone, children }: { title: string; tone?: "danger"; children: React.ReactNode }) {
  return (
    <div className={`border p-6 space-y-3 ${tone === "danger" ? "border-destructive/30" : "border-ink/10"}`}>
      <h2 className="font-serif text-xl">{title}</h2>
      {children}
    </div>
  );
}
