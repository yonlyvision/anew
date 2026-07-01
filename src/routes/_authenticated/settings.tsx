import { createFileRoute } from "@tanstack/react-router";

import { SettingsRow } from "@/components/settings/SettingsShell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Anew" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <span className="text-[11px] uppercase tracking-[0.3em] text-accent italic">Account</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">Settings</h1>
      <p className="mt-3 text-sm text-ink/60">Manage your account, privacy, and security preferences.</p>

      <div className="mt-12 space-y-3">
        <SettingsRow
          to="/settings/account"
          title="Account"
          description="Password, profile visibility, and membership."
        />
        <SettingsRow
          to="/settings/privacy"
          title="Privacy & security"
          description="Blocked members, privacy policy, and account deletion."
        />
      </div>
    </section>
  );
}
