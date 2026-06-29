import { createFileRoute, Link } from "@tanstack/react-router";
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

const INTENTIONS = [
  "A serious relationship",
  "Open to seeing what develops",
  "New friendships first, then more",
  "Not sure yet",
] as const;

const AUDIENCE_TYPES = [
  "I'm rebuilding after a significant life transition",
  "I'm open to connecting with someone who is rebuilding",
  "Both describe me",
] as const;

const VALUE_OPTIONS = [
  "Honesty",
  "Respect",
  "Accountability",
  "Safety",
  "Growth",
  "Real connection",
] as const;

function ApplyPage() {
  const submitFn = useServerFn(submitApplication);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [audienceType, setAudienceType] = useState("");
  const [intention, setIntention] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [heardAbout, setHeardAbout] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [agree, setAgree] = useState(false);
  const [agreeDisclaimer, setAgreeDisclaimer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"pending" | "approved" | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isAdult) {
      setError("You must confirm you are 18 or older to apply.");
      return;
    }
    if (!agree) {
      setError("Please confirm you've read and agree to our Community Values.");
      return;
    }
    if (!agreeDisclaimer) {
      setError("Please confirm you've read and agree to the Website Disclaimer.");
      return;
    }
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 18) {
      setError("Please enter your age (18 or older).");
      return;
    }
    if (selectedValues.length !== 3) {
      setError("Please choose exactly three values that matter most to you.");
      return;
    }
    setLoading(true);
    try {
      if (!turnstileToken) throw new Error("Please complete the CAPTCHA");
      // The applications table stores a single free-text note, so we compose the
      // structured answers into one readable block for the reviewer.
      const composedMessage = [
        age ? `Age: ${age}` : null,
        audienceType ? `How they relate to Anew: ${audienceType}` : null,
        location ? `Location: ${location}` : null,
        intention ? `Looking for: ${intention}` : null,
        selectedValues.length ? `Top 3 values: ${selectedValues.join(", ")}` : null,
        message ? `What brings them to Anew: ${message}` : null,
        heardAbout ? `Heard about us via: ${heardAbout}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const result = await submitFn({
        data: {
          email,
          firstName,
          message: composedMessage || undefined,
          turnstileToken,
        },
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
              Apply to the founding group.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink/65">
              We're opening Anew slowly to protect quality, privacy, and trust.
              A few short questions help us understand your intent before we invite
              you in — no password or account yet. We review every application
              personally and reply within 3–5 days.
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
                    ? "Good news — this email is already approved. Create your account below."
                    : "We've got your application. We review these personally and will email you within 3–5 days, whether it's a yes or a no. If approved, you'll get a link to create your account and complete your profile."}
                </p>
                {done === "approved" && (
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-accent transition-colors"
                  >
                    Create your account
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Join the founding group
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight">Apply to join</h2>
                <p className="mt-3 text-sm leading-7 text-ink/58">
                  Takes about two minutes. No password needed yet.
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
                  <Field label="Age">
                    <input
                      type="number"
                      required
                      min={18}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="18+"
                      className={fieldClassName}
                    />
                  </Field>
                  <Field label="City and country">
                    <input
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Ottawa, Canada"
                      className={fieldClassName}
                    />
                  </Field>
                  <Field label="Which best describes you?">
                    <select
                      required
                      value={audienceType}
                      onChange={(e) => setAudienceType(e.target.value)}
                      className={fieldClassName}
                    >
                      <option value="" disabled>
                        Choose one…
                      </option>
                      {AUDIENCE_TYPES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="What are you looking for?">
                    <select
                      required
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      className={fieldClassName}
                    >
                      <option value="" disabled>
                        Choose one…
                      </option>
                      {INTENTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <fieldset className="block space-y-3">
                    <legend className="text-xs font-medium text-ink/55">
                      Pick your top 3 values (choose exactly three)
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {VALUE_OPTIONS.map((value) => {
                        const checked = selectedValues.includes(value);
                        return (
                          <label
                            key={value}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                              checked
                                ? "border-accent/40 bg-accent/5 text-ink"
                                : "border-ink/10 bg-paper text-ink/70"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedValues((prev) => {
                                  if (prev.includes(value)) {
                                    return prev.filter((v) => v !== value);
                                  }
                                  if (prev.length >= 3) return prev;
                                  return [...prev, value];
                                });
                              }}
                              className="h-4 w-4 rounded border-ink/30 accent-accent"
                            />
                            {value}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-ink/45">
                      {selectedValues.length}/3 selected
                    </p>
                  </fieldset>
                  <Field label="What brings you to Anew right now?">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={1000}
                      placeholder="A sentence or two is plenty."
                      className={`${fieldClassName} min-h-24`}
                    />
                  </Field>
                  <Field label="How did you hear about Anew? (optional)">
                    <input
                      value={heardAbout}
                      onChange={(e) => setHeardAbout(e.target.value)}
                      className={fieldClassName}
                    />
                  </Field>

                  <label className="flex items-start gap-3 text-sm leading-6 text-ink/65">
                    <input
                      type="checkbox"
                      checked={isAdult}
                      onChange={(e) => setIsAdult(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-ink/30 accent-accent"
                    />
                    <span>I confirm I am 18 years of age or older.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm leading-6 text-ink/65">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-ink/30 accent-accent"
                    />
                    <span>
                      I've read and agree to the{" "}
                      <a href="/community-values" className="text-accent underline-offset-4 hover:underline">
                        Community Values
                      </a>
                      .
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm leading-6 text-ink/65">
                    <input
                      type="checkbox"
                      checked={agreeDisclaimer}
                      onChange={(e) => setAgreeDisclaimer(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-ink/30 accent-accent"
                    />
                    <span>
                      I've read and agree to the{" "}
                      <a href="/disclaimer" className="text-accent underline-offset-4 hover:underline">
                        Website Disclaimer
                      </a>
                      , including the safety notice that we do not run background checks.
                    </span>
                  </label>

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
                    disabled={
                      loading ||
                      !turnstileToken ||
                      !isAdult ||
                      !agree ||
                      !agreeDisclaimer ||
                      selectedValues.length !== 3
                    }
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
