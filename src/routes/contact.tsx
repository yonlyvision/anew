import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";

import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";
import { submitContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Anew" },
      {
        name: "description",
        content:
          "Reach the Anew team for account support, safety concerns, partnership inquiries, or general questions.",
      },
      { property: "og:title", content: "Contact Anew" },
      { property: "og:description", content: "We read every note. Most replies arrive within a day." },
    ],
  }),
  component: Contact,
});

const reasons = [
  "General question",
  "Account support",
  "Safety concern",
  "Report a member",
  "Partnership",
  "Media inquiry",
] as const;

function Contact() {
  const submitFn = useServerFn(submitContactMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<(typeof reasons)[number]>(reasons[0]);
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!turnstileToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }
    setLoading(true);
    try {
      await submitFn({
        data: { name, email, reason, message, turnstileToken },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title={<>We read every note.</>}
        intro="Most replies arrive within a day. Safety concerns are prioritised and reviewed by a human within hours."
      />
      <section className="mx-auto max-w-2xl px-6 md:px-8 pb-32">
        {sent ? (
          <div className="rounded-2xl border border-ink/10 p-10 text-center space-y-4">
            <p className="font-serif text-2xl">Thank you.</p>
            <p className="text-ink/60">Your note is with our team. We will be in touch soon.</p>
            <p className="text-sm text-ink/45">
              For urgent safety matters, you can also email{" "}
              <a href="mailto:support@inm8tebook.net" className="text-accent hover:underline">
                support@inm8tebook.net
              </a>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <Field label="Your name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                className={fieldClassName}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={320}
                className={fieldClassName}
              />
            </Field>
            <Field label="Reason">
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value as (typeof reasons)[number])}
                className={fieldClassName}
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Message">
              <textarea
                required
                rows={6}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${fieldClassName} resize-y min-h-32`}
              />
            </Field>

            <div className="rounded-2xl border border-ink/8 bg-paper/75 px-4 py-4">
              <TurnstileWidget onToken={setTurnstileToken} className="flex justify-center" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="px-8 py-4 bg-ink text-paper text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] uppercase tracking-[0.25em] text-ink/60">{label}</label>
      {children}
    </div>
  );
}
