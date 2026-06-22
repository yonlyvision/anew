import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";

import { SiteLayout } from "@/components/site/SiteLayout";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";
import { submitApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply — Anew" },
      {
        name: "description",
        content:
          "Apply to join Anew. We review every application personally and let you know once you're approved.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const submitFn = useServerFn(submitApplication);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"pending" | "approved" | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!turnstileToken) throw new Error("Please complete the CAPTCHA");
      const result = await submitFn({
        data: { email, firstName, message: message || undefined, turnstileToken },
      });
      setDone(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_top_left,_rgba(229,98,84,0.10),_transparent_28%),radial-gradient(circle_at_88%_14%,_rgba(46,138,146,0.14),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(255,247,241,1))]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:px-8 md:py-20 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,34rem)] xl:items-start">
          <div className="max-w-2xl pt-4">
            <span className="inline-flex items-center rounded-full border border-accent/15 bg-paper/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent backdrop-blur">
              Apply in about a minute
            </span>
            <h1 className="mt-7 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-7xl">
              We're starting small, on purpose.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink/65">
              Anew is opening to a small group first. Leave your name and email
              below — no password, no account yet. We review every application
              personally and reach out directly once you're approved to create
              your account.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <PromisePill title="No spam, ever">
                Your email is only used to tell you about your application.
              </PromisePill>
              <PromisePill title="Reviewed by a person">
                Every application gets a real look before a decision.
              </PromisePill>
              <PromisePill title="You'll hear from us">
                Approved or not, we'll let you know directly.
              </PromisePill>
            </div>
          </div>

          <div className="rounded-[2rem] border border-ink/8 bg-card/92 p-6 shadow-[0_30px_80px_-50px_rgba(32,23,20,0.45)] backdrop-blur md:p-8">
            {done ? (
              <div className="py-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Application received
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight">
                  {done === "approved" ? "You're already approved" : "Thank you"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-ink/60">
                  {done === "approved"
                    ? "Good news — this email is already approved. Head to the sign in page to create your account."
                    : "We've got your application. We review these personally and will reach out directly once a decision is made."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Join the community
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight">Apply to join</h2>
                <p className="mt-3 text-sm leading-7 text-ink/58">
                  Takes about a minute. No password needed yet.
                </p>

                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                  <Field label="First name">
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={fieldClassName}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClassName}
                    />
                  </Field>
                  <Field label="Anything you'd like us to know (optional)">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={1000}
                      className={`${fieldClassName} min-h-24`}
                    />
                  </Field>

                  {error && <p className="text-sm text-destructive">{error}</p>}

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
                    {loading ? "Submitting…" : "Submit application"}
                  </button>
                </form>
              </>
            )}
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
