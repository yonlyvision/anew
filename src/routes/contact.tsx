import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

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
  "Billing question",
] as const;

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title={<>We read every note.</>}
        intro="Most replies arrive within a day. Safety concerns are prioritised and reviewed by a human within hours."
      />
      <section className="mx-auto max-w-2xl px-6 md:px-8 pb-32">
        {sent ? (
          <div className="border border-ink/10 p-10 text-center space-y-4">
            <p className="font-serif text-2xl">Thank you.</p>
            <p className="text-ink/60">Your note is with our team. We will be in touch soon.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-6"
          >
            <Field label="Your name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.25em] text-ink/60">Reason</label>
              <select
                name="reason"
                required
                className="w-full border border-ink/15 bg-paper px-4 py-3 text-sm focus:border-ink outline-none"
              >
                {reasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.25em] text-ink/60">Message</label>
              <textarea
                name="message"
                required
                rows={6}
                maxLength={2000}
                className="w-full border border-ink/15 bg-paper px-4 py-3 text-sm focus:border-ink outline-none resize-y"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-ink text-paper text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors"
            >
              Send
            </button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] uppercase tracking-[0.25em] text-ink/60">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={255}
        className="w-full border border-ink/15 bg-paper px-4 py-3 text-sm focus:border-ink outline-none"
      />
    </div>
  );
}
