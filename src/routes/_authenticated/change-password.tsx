import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/change-password")({
  head: () => ({
    meta: [
      { title: "Set your password — Anew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setLoading(true);
    // Set the new password AND clear the forced-change flag in one call.
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <section className="mx-auto max-w-md px-6 py-20 md:py-28">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">
        One quick step
      </span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight">
        Choose your password
      </h1>
      <p className="mt-5 text-sm leading-7 text-ink/62">
        Your account was created with a temporary password. Set your own
        password to continue — you won't be able to use the rest of the app
        until this is done.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">
            New password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">
            Confirm password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink py-3 text-[11px] uppercase tracking-[0.3em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
        >
          {loading ? "Saving…" : "Set password & continue"}
        </button>
      </form>
    </section>
  );
}
