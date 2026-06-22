import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";

import { SiteLayout } from "@/components/site/SiteLayout";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";
import { supabase } from "@/integrations/supabase/client";
import { verifyAuthCaptcha } from "@/lib/contact.functions";
import { lovable } from "@/integrations/lovable/index";
import { useServerFn } from "@tanstack/react-start";

const searchSchema = z.object({
  mode: z.enum(["signup", "signin"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Anew" },
      {
        name: "description",
        content:
          "Sign in or apply to join Anew, a private community for second-chance connection.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const verifyCaptcha = useServerFn(verifyAuthCaptcha);

  useEffect(() => {
    setMode(search.mode ?? "signin");
  }, [search.mode]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        router.invalidate();
        navigate({ to: search.redirect ?? "/dashboard", replace: true });
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: search.redirect ?? "/dashboard", replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate, router, search.redirect]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (!turnstileToken) throw new Error("Please complete the CAPTCHA");
      await verifyCaptcha({ data: { turnstileToken } });

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });
        if (error) throw error;
        setInfo("Welcome. Taking you to your dashboard…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) setError(result.error.message ?? "Could not sign in with Google");
  }

  const applying = mode === "signup";
  const title = applying
    ? "You're approved. Let's create your account."
    : "Welcome back to Anew.";
  const eyebrow = applying ? "For approved members" : "Your next chapter is waiting";
  const primaryLabel = loading ? "Please wait…" : applying ? "Create account" : "Sign in";

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_top_left,_rgba(229,98,84,0.10),_transparent_28%),radial-gradient(circle_at_88%_14%,_rgba(46,138,146,0.14),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(255,247,241,1))]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:px-8 md:py-20 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,34rem)] xl:items-start">
          <div className="max-w-2xl pt-4">
            <span className="inline-flex items-center rounded-full border border-accent/15 bg-paper/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent backdrop-blur">
              {eyebrow}
            </span>
            <h1 className="mt-7 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink/65">
              {applying
                ? "We let you know personally once your application is accepted. This is the last step: set a password and your account is live."
                : "Pick up where you left off. Your profile, matches, and conversations are waiting in a safer, slower experience built for people looking for something real."}
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <PromisePill title="Private by design">
                No public browsing and no pressure to overshare.
              </PromisePill>
              <PromisePill title="Human review">
                Verification and safety checks are handled with care.
              </PromisePill>
              <PromisePill title="Conversation-first">
                Profiles are built to make the first hello easier.
              </PromisePill>
            </div>

            <div className="mt-10 rounded-[2rem] border border-ink/8 bg-paper/84 p-6 shadow-[0_22px_70px_-52px_rgba(32,24,20,0.35)] backdrop-blur md:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
                What happens next
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <FlowCard number="01" title="Create your account">
                  Start with your name, email, and a secure password.
                </FlowCard>
                <FlowCard number="02" title="Complete your profile">
                  Share your values, goals, and what this chapter means to you.
                </FlowCard>
                <FlowCard number="03" title="Verify and begin">
                  Add trust signals, explore thoughtful matches, and start with confidence.
                </FlowCard>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-ink/8 bg-card/92 p-6 shadow-[0_30px_80px_-50px_rgba(32,23,20,0.45)] backdrop-blur md:p-8">
            <div className="inline-flex rounded-full border border-ink/8 bg-muted-warm p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  !applying ? "bg-paper text-ink shadow-sm" : "text-ink/55 hover:text-ink"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  applying ? "bg-paper text-ink shadow-sm" : "text-ink/55 hover:text-ink"
                }`}
              >
                Create account
              </button>
            </div>

            <div className="mt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                {applying ? "Join the community" : "Member access"}
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">
                {applying ? "Create your account" : "Sign in to your account"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-ink/58">
                {applying
                  ? "Only for emails we've already approved. Haven't applied yet? Use the Apply page first."
                  : "Use the account you already created to return to your profile, matches, and messages."}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={onGoogle}
                className="w-full rounded-full border border-ink/10 bg-paper py-3 text-sm font-medium transition-colors hover:bg-muted-warm"
              >
                Continue with Google
              </button>
              <div className="relative text-center">
                <span className="relative z-10 bg-card px-3 text-xs text-ink/40">
                  or with email
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-ink/10" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                {applying && (
                  <Field label="First name">
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={fieldClassName}
                    />
                  </Field>
                )}
                <Field label="Email">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClassName}
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClassName}
                  />
                </Field>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {info && <p className="text-sm text-ink/60">{info}</p>}

                <div className="rounded-[1.4rem] border border-ink/8 bg-paper/75 px-4 py-4">
                  <p className="text-xs leading-6 text-ink/56">
                    CAPTCHA protects the application flow from spam and keeps the
                    community cleaner for real members.
                  </p>
                  <TurnstileWidget
                    onToken={setTurnstileToken}
                    className="mt-3 flex justify-center"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="w-full rounded-full bg-gradient-to-r from-ink to-[#3a2c25] py-3 text-sm font-medium text-paper shadow-sm transition-all hover:from-accent hover:to-[#ef886f] disabled:opacity-60"
                >
                  {primaryLabel}
                </button>
              </form>

              <div className="flex items-center justify-between gap-4 pt-2 text-xs text-ink/55">
                {applying ? (
                  <button type="button" onClick={() => setMode("signin")} className="hover:text-accent">
                    Already a member? Sign in
                  </button>
                ) : (
                  <Link to="/apply" className="hover:text-accent">
                    New here? Apply to join
                  </Link>
                )}
                <Link to="/reset-password" className="hover:text-accent">
                  Forgot password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

const fieldClassName =
  "w-full rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-ink/55">{label}</span>
      {children}
    </label>
  );
}

function PromisePill({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.6rem] border border-ink/8 bg-paper/76 px-4 py-4 backdrop-blur">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-ink/56">{children}</p>
    </div>
  );
}

function FlowCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-ink/8 bg-white/82 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
        {number}
      </p>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/56">{children}</p>
    </div>
  );
}
