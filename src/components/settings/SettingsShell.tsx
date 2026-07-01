import { Link } from "@tanstack/react-router";

type SettingsShellProps = {
  title: string;
  subtitle?: string;
  backTo?: "/settings" | "/settings/privacy";
  children: React.ReactNode;
};

export function SettingsShell({ title, subtitle, backTo = "/settings", children }: SettingsShellProps) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link to={backTo} className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink">
        ← Back to settings
      </Link>
      <span className="mt-6 block text-[11px] uppercase tracking-[0.3em] text-accent italic">Account</span>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">{title}</h1>
      {subtitle ? <p className="mt-3 text-sm text-ink/60">{subtitle}</p> : null}
      {children}
    </section>
  );
}

type SettingsRowProps = {
  to: string;
  title: string;
  description: string;
};

export function SettingsRow({ to, title, description }: SettingsRowProps) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-4 border border-ink/10 bg-paper/80 px-5 py-4 transition hover:border-ink/25 hover:shadow-sm"
    >
      <div>
        <p className="font-serif text-lg">{title}</p>
        <p className="mt-0.5 text-sm text-ink/55">{description}</p>
      </div>
      <span className="shrink-0 text-ink/35" aria-hidden>
        →
      </span>
    </Link>
  );
}

export function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-ink/10 bg-paper/80 p-6 space-y-3">
      <h2 className="font-serif text-xl">{title}</h2>
      {children}
    </div>
  );
}
