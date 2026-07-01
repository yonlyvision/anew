import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { setProfilePaused } from "@/lib/profile.functions";
import { SettingsCard, SettingsShell } from "@/components/settings/SettingsShell";

export const Route = createFileRoute("/_authenticated/settings/account")({
  head: () => ({ meta: [{ title: "Account — Anew" }, { name: "robots", content: "noindex" }] }),
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const { userId } = Route.useRouteContext();
  const pauseFn = useServerFn(setProfilePaused);

  const [email, setEmail] = useState("");
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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

  if (loading) {
    return (
      <SettingsShell title="Account">
        <p className="mt-12 text-sm text-ink/50">Loading…</p>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell title="Account" subtitle="Password, visibility, and membership.">
      <div className="mt-12 space-y-6">
        <SettingsCard title="Password">
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
        </SettingsCard>

        <SettingsCard title="Pause profile">
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
        </SettingsCard>

        <SettingsCard title="Membership">
          <p className="text-sm text-ink/60">
            You're on the Free plan — full access at no cost. Premium features are on the way.
          </p>
        </SettingsCard>
      </div>
    </SettingsShell>
  );
}
