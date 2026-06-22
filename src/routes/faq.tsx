import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently asked questions — Anew" },
      {
        name: "description",
        content:
          "Who Anew is for, how safety works, what verification looks like, and how to manage your account.",
      },
      { property: "og:title", content: "Anew FAQ" },
      { property: "og:description", content: "Honest answers to the questions members ask most." },
    ],
  }),
  component: FAQ,
});

const items = [
  {
    q: "Is Anew only for people with a difficult past?",
    a: "No. Anew is for anyone who believes in growth, honesty, and second chances — including open-hearted people who are willing to meet someone beyond their past.",
  },
  {
    q: "Can regular people join?",
    a: "Yes. Anyone 18+ who respects our mission and community values is welcome.",
  },
  {
    q: "Do I have to share my full story publicly?",
    a: "No. You decide what you share, when, and with whom. The 'New Chapter' section is yours to write — or to leave for later.",
  },
  {
    q: "How is the platform kept safe?",
    a: "Verification (email, phone, selfie, optional ID), human moderators, one-tap report and block tools, and a clear community code we actually enforce.",
  },
  {
    q: "Can I delete or pause my account?",
    a: "Yes, at any time from Settings. Pausing hides your profile from discovery. Deleting removes your data per our Privacy Policy.",
  },
  {
    q: "Can I block someone?",
    a: "Yes. Blocking is one tap. Once blocked, the other person cannot message you, view your profile, or interact with you anywhere on Anew.",
  },
  {
    q: "Can I report suspicious behaviour?",
    a: "Yes — and we read every report. Harassment, scams, threats, fake profiles, and requests for money are all reportable inside any conversation or profile.",
  },
  {
    q: "Is Anew free?",
    a: "Yes. A free plan lets you build a profile, browse, like, match, and message your matches. Premium adds full visibility, unlimited likes, and advanced filters.",
  },
] as const;

function FAQ() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="FAQ"
        title={<>Honest answers.</>}
        intro="If you do not see your question here, our team is one short note away."
      />
      <section className="mx-auto max-w-3xl px-6 md:px-8 pb-32 divide-y divide-ink/10">
        {items.map((it, i) => (
          <Item key={i} q={it.q} a={it.a} />
        ))}
      </section>
    </SiteLayout>
  );
}

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-6 text-left"
      >
        <span className="font-serif text-xl md:text-2xl">{q}</span>
        <span className="text-accent font-serif text-2xl leading-none mt-1">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <p className="mt-4 text-ink/70 leading-relaxed">{a}</p>}
    </div>
  );
}
