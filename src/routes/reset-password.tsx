import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Anew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else setUpdated(true);
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-20 md:py-28">
        <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight text-center">
          {isRecovery ? "Set a new password" : "Reset password"}
        </h1>

        <div className="mt-12 space-y-4">
          {!isRecovery && !sent && (
            <form onSubmit={onRequest} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink"
                />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink py-3 text-[11px] uppercase tracking-[0.3em] text-paper hover:bg-accent transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          {sent && (
            <p className="text-sm text-ink/70">
              Check your inbox for a reset link. It may take a minute to arrive.
            </p>
          )}

          {isRecovery && !updated && (
            <form onSubmit={onUpdate} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink"
                />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink py-3 text-[11px] uppercase tracking-[0.3em] text-paper hover:bg-accent transition-colors disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}

          {updated && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink/70">Password updated. You can sign in now.</p>
              <Link to="/auth" className="inline-block bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-paper">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
