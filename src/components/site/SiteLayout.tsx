import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const navLinks = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/safety", label: "Safety" },
  { to: "/community-values", label: "Values" },
  { to: "/blog", label: "Journal" },
  { to: "/success-stories", label: "Stories" },
  { to: "/pricing", label: "Membership" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-accent/25">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          <Link to="/" className="group flex items-center gap-2 font-serif text-2xl font-medium tracking-tight">
            <span className="inline-block h-2 w-2 rounded-full bg-accent transition-transform group-hover:scale-125" />
            Anew
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-ink/55">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3.5 py-2 transition-colors hover:bg-ink/5 hover:text-ink"
                activeProps={{ className: "rounded-full px-3.5 py-2 bg-ink/5 text-ink" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/auth"
              className="hidden md:inline-block rounded-full px-4 py-2 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              to="/apply"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper shadow-sm transition-all hover:bg-accent hover:shadow-md"
            >
              Apply
            </Link>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-card"
            >
              <span className="sr-only">Menu</span>
              <div className="space-y-1.5">
                <span className="block h-0.5 w-4 rounded-full bg-ink" />
                <span className="block h-0.5 w-4 rounded-full bg-ink" />
                <span className="block h-0.5 w-4 rounded-full bg-ink" />
              </div>
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-ink/5 px-6 py-4">
            <nav className="grid gap-1 text-sm font-medium text-ink/70">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 hover:bg-ink/5 hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-ink/5 hover:text-ink"
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="mt-24 border-t border-ink/5 bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <div className="flex flex-col items-start justify-between gap-12 md:flex-row">
            <div className="max-w-sm space-y-4">
              <div className="flex items-center gap-2 font-serif text-2xl font-medium">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                Anew
              </div>
              <p className="text-sm leading-relaxed text-paper/70">
                A private community for people who believe in growth, honesty, and second chances.
              </p>
              <p className="text-xs text-paper/40">Est. 2024 · Members 18+</p>
            </div>
            <div className="grid grid-cols-2 gap-10 md:grid-cols-3 md:gap-16">
              <FooterCol title="Platform">
                <FooterLink to="/how-it-works">How it works</FooterLink>
                <FooterLink to="/pricing">Membership</FooterLink>
                <FooterLink to="/success-stories">Stories</FooterLink>
                <FooterLink to="/blog">Journal</FooterLink>
              </FooterCol>
              <FooterCol title="Trust">
                <FooterLink to="/safety">Safety</FooterLink>
                <FooterLink to="/community-values">Community values</FooterLink>
                <FooterLink to="/faq">FAQ</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
              </FooterCol>
              <FooterCol title="Legal">
                <FooterLink to="/terms">Terms</FooterLink>
                <FooterLink to="/privacy">Privacy</FooterLink>
                <FooterLink to="/cookies">Cookies</FooterLink>
              </FooterCol>
            </div>
          </div>
          <div className="mt-16 border-t border-paper/10 pt-8 text-xs text-paper/40">
            © {new Date().getFullYear()} Anew Collective
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-paper/50">{title}</p>
      <ul className="space-y-2.5 text-sm text-paper/70">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="transition-colors hover:text-accent">
        {children}
      </Link>
    </li>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-12 pt-20 md:px-8 md:pb-16 md:pt-28">
      <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
        {eyebrow}
      </span>
      <h1 className="mt-6 font-serif text-4xl leading-[1.1] tracking-tight text-balance md:text-6xl">
        {title}
      </h1>
      {intro && (
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/65 text-pretty">{intro}</p>
      )}
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 pb-24 leading-relaxed text-ink/75 md:px-8 [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
      {children}
    </div>
  );
}
