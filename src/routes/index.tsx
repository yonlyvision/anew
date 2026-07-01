import { createFileRoute, Link } from "@tanstack/react-router";

import alexHero from "@/assets/portraits/alex-hero.jpg";
import marcusCommunity from "@/assets/portraits/marcus-community.jpg";
import mayaHero from "@/assets/portraits/maya-hero.jpg";
import meiCommunity from "@/assets/portraits/mei-community.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anew — A second chance at love. A first chance at you." },
      {
        name: "description",
        content:
          "A private dating community for people rebuilding after a hard season — and for partners open to meeting them as they are now.",
      },
    ],
  }),
  component: HomePage,
});

const trustSignals = [
  {
    title: "Verified members",
    copy: "Real people from different backgrounds, with clearer intentions and fewer dead ends.",
  },
  {
    title: "Private by design",
    copy: "Your story stays yours until you choose to share it.",
  },
  {
    title: "Reviewed by people",
    copy: "Reports are read by a real person, not just an automated filter.",
  },
];

const communityFaces = [
  { imageSrc: alexHero, name: "Marcus" },
  { imageSrc: mayaHero, name: "Nadia" },
  { imageSrc: marcusCommunity, name: "David" },
  { imageSrc: meiCommunity, name: "Mei" },
];

const flowSteps = [
  {
    eyebrow: "1. Apply",
    title: "Start with who you are now",
    copy:
      "A short application — not a swipe tunnel. We ask who you are, what you want, and why you're here.",
  },
  {
    eyebrow: "2. Verify",
    title: "Build trust before chemistry",
    copy:
      "Email, phone, and selfie checks help members feel safer before conversations ever begin.",
  },
  {
    eyebrow: "3. Discover",
    title: "See more than a pretty photo",
    copy:
      "Profiles foreground compatibility, emotional readiness, and conversation spark instead of endless superficial browsing.",
  },
  {
    eyebrow: "4. Connect",
    title: "Make the first message easier",
    copy:
      "Shared values, prompt answers, and clearer match context reduce the friction that usually kills great conversations.",
  },
];

const forYou = [
  "You're serious about dating — not collecting matches.",
  "You value honesty over a flawless story.",
  "You want privacy before exposure.",
  "You're open-minded, but not careless.",
  "You'd take fewer matches and better conversations.",
];

const notForYou = [
  "You're looking for hookups.",
  "You hide major truths from people you date.",
  "You ask people for money.",
  "You're not ready to be accountable.",
  "You expect people to overlook your past without earning their trust.",
];

function HomePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(229,98,84,0.12),_transparent_35%),radial-gradient(circle_at_82%_12%,_rgba(46,138,146,0.14),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(255,247,241,0.98))]" />
        <div className="absolute left-1/2 top-24 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-18 pt-14 md:px-8 md:pb-24 md:pt-18 xl:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)] xl:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-accent/10 bg-accent/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              A new chapter
            </span>
            <h1 className="mt-8 max-w-[12ch] font-serif text-6xl leading-[0.95] tracking-[-0.04em] text-balance sm:text-7xl lg:text-[5.5rem]">
              A second chance at <span className="text-accent">love</span>. A first
              chance at <span className="text-teal">you</span>.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-ink/68 md:text-[1.1rem]">
              A private community for people redefining their path, and for
              those open to loving someone beyond their past. You are not
              starting over. You are starting something real.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/apply"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-[#ea7d63] px-8 py-4 text-base font-semibold text-paper shadow-[0_18px_40px_-24px_rgba(229,98,84,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Apply to join
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-accent/30 bg-paper/75 px-8 py-4 text-base font-semibold text-accent backdrop-blur transition-colors hover:border-accent hover:bg-paper"
              >
                How it works
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[40rem] origin-top scale-[0.82] sm:scale-90 md:scale-95 xl:col-start-2 xl:row-span-2 xl:mx-0 xl:scale-100">
            <div className="absolute left-[3%] top-[8%] z-20 inline-flex rounded-full border border-ink/8 bg-paper/88 px-4 py-2 text-sm font-medium text-ink shadow-lg backdrop-blur">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-teal" />
              Verified
            </div>
            <div className="absolute right-[7%] top-[16%] z-30 flex h-20 w-20 items-center justify-center rounded-full bg-paper shadow-[0_22px_45px_-28px_rgba(30,22,19,0.45)]">
              <span className="text-3xl text-accent">♥</span>
            </div>

            <div className="relative min-h-[32rem] sm:min-h-[36rem] xl:min-h-[38rem]">
              <HeroMemberCard
                className="left-0 top-2 z-10 w-[60%] rotate-[-3deg]"
                name="Marcus"
                age="34"
                role="Five years out. Looking for something family-minded, at a slower pace."
                location="Ottawa, ON"
                tags={["Honesty", "Accountability", "Faith"]}
                imageSrc={alexHero}
                imageAlt="Marcus profile portrait"
              />
              <HeroMemberCard
                className="right-0 top-24 z-20 w-[57%] rotate-[4deg]"
                name="Nadia"
                age="31"
                role="Looking for something serious"
                location="Montreal, QC"
                tags={["Loyalty", "Humour", "Emotional safety"]}
                imageSrc={mayaHero}
                imageAlt="Nadia profile portrait"
              />

              <div className="absolute left-[47%] top-[54%] z-30 flex h-36 w-36 -translate-x-1/2 items-center justify-center rounded-full border border-accent/22 bg-paper/90 text-center shadow-[0_22px_50px_-28px_rgba(229,98,84,0.55)] backdrop-blur">
                <div>
                  <p className="font-serif text-4xl text-accent">87%</p>
                  <p className="mt-1 text-sm leading-5 text-ink/56">
                    compatibility
                  </p>
                </div>
              </div>

              <QuoteCard />
              <MatchCard />
            </div>
          </div>

          <div className="max-w-2xl xl:col-start-1 xl:row-start-2">
            <div className="grid gap-4 md:grid-cols-3">
              {trustSignals.map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-3xl border border-ink/8 bg-paper/72 px-4 py-4 backdrop-blur"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 to-gold/18 text-accent">
                    <TrustIcon title={signal.title} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink">{signal.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/56">{signal.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-16">
        <div className="rounded-[2rem] border border-ink/8 bg-card/86 p-8 shadow-[0_28px_80px_-54px_rgba(33,24,20,0.35)] md:p-10">
          <SectionHeading
            eyebrow="How it works"
            title="Apply. Verify. Meet someone worth the wait."
            intro="We put trust before chemistry — so your first conversation starts on solid ground, not a guess."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {flowSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-[1.75rem] border border-ink/8 bg-paper px-5 py-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  {step.eyebrow}
                </p>
                <h3 className="mt-4 text-2xl leading-tight text-ink">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/60">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-18">
        <SectionHeading
          eyebrow="Who it's for"
          title="Built for people who are done performing."
          intro="We'd rather be the right fit for a few people than a vague fit for everyone. Here's who Anew is — and isn't — for."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-accent/15 bg-paper px-6 py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              This is for you if
            </p>
            <ul className="mt-5 space-y-3">
              {forYou.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm leading-6 text-ink/70">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-ink/10 bg-muted-warm px-6 py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/45">
              This is not for you if
            </p>
            <ul className="mt-5 space-y-3">
              {notForYou.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm leading-6 text-ink/60">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-ink/25" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-8 md:pb-28 md:pt-14">
        <div className="overflow-hidden rounded-[2.4rem] border border-ink/8 bg-ink px-7 py-10 text-paper shadow-[0_32px_80px_-50px_rgba(24,19,16,0.75)] md:px-10 md:py-12">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-paper/55">
                Join the founding group
              </p>
              <h2 className="mt-4 max-w-[12ch] font-serif text-5xl leading-[0.98] tracking-[-0.03em]">
                Start with honesty. Let the rest follow.
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-8 text-paper/75">
                We're opening Anew to a small founding group first. Apply in about
                a minute, and if it's a fit, you'll help shape a community where
                people are met as who they are now — not the worst day of their
                past.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-[#ec8268] px-8 py-4 text-base font-semibold text-paper transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Apply to join
                </Link>
                <Link
                  to="/safety"
                  className="inline-flex items-center justify-center rounded-full border border-paper/18 px-8 py-4 text-base font-semibold text-paper/88 transition-colors hover:bg-paper/8"
                >
                  Explore safety
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.03em] text-ink md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-ink/62">{intro}</p>
    </div>
  );
}

function HeroMemberCard({
  className,
  name,
  age,
  role,
  location,
  tags,
  imageSrc,
  imageAlt,
}: {
  className: string;
  name: string;
  age: string;
  role: string;
  location: string;
  tags: string[];
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div
      className={`absolute overflow-hidden rounded-[2.1rem] border border-white/80 bg-paper p-3 shadow-[0_35px_90px_-55px_rgba(37,26,21,0.55)] ${className}`}
    >
      <div className="overflow-hidden rounded-[1.6rem]">
        <PortraitSurface imageSrc={imageSrc} imageAlt={imageAlt} />
      </div>
      <div className="absolute left-7 top-8 inline-flex items-center gap-2 rounded-full bg-paper/88 px-4 py-2 text-sm font-medium text-ink shadow-sm backdrop-blur">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal" />
        Verified
      </div>
      <div className="absolute inset-x-7 bottom-7 text-paper">
        <h3 className="flex items-center gap-2 text-4xl leading-none drop-shadow-sm">
          <span>
            {name}, {age}
          </span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal/92 text-sm text-paper">
            ✓
          </span>
        </h3>
        <p className="mt-3 text-lg text-paper/92">{role}</p>
        <p className="mt-2 text-sm text-paper/78">{location}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/28 bg-white/12 px-3 py-1 text-xs font-medium text-paper/92 backdrop-blur"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PortraitSurface({
  imageSrc,
  imageAlt,
}: {
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div className="relative aspect-[5/6] overflow-hidden bg-[#efe2d2]">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,_rgba(255,248,238,0.38),_transparent_26%),radial-gradient(circle_at_78%_16%,_rgba(255,214,184,0.24),_transparent_28%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/58 via-black/18 to-transparent" />
    </div>
  );
}

function QuoteCard() {
  return (
    <div className="absolute bottom-9 left-[9%] z-30 w-[56%] rounded-[1.9rem] border border-ink/8 bg-paper/94 p-6 shadow-[0_26px_55px_-38px_rgba(35,25,22,0.55)] backdrop-blur">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 text-2xl text-accent">
        “
      </div>
      <p className="mt-5 font-serif text-2xl leading-[1.3] text-ink">
        I didn't come here to be fixed. I came to be seen for who I am now.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink/52">For people done performing.</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/34">
            Across backgrounds and stories
          </p>
        </div>
        <CommunityFaces />
      </div>
    </div>
  );
}

function MatchCard() {
  return (
    <div className="absolute bottom-0 right-[2%] z-30 w-[48%] rounded-[1.8rem] border border-ink/8 bg-paper/96 p-5 shadow-[0_26px_55px_-38px_rgba(35,25,22,0.55)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/14 text-2xl text-accent">
            ♥
          </div>
          <div>
            <p className="text-lg font-semibold text-accent">It&apos;s a match!</p>
            <p className="text-sm text-ink/54">You and Nadia liked each other.</p>
          </div>
        </div>
        <div className="flex -space-x-3">
          <MiniAvatar imageSrc={alexHero} name="Marcus" />
          <MiniAvatar imageSrc={mayaHero} name="Nadia" />
        </div>
      </div>
    </div>
  );
}

function MiniAvatar({ imageSrc, name }: { imageSrc: string; name: string }) {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-paper bg-[#f0e5d8] shadow-sm">
      <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
    </div>
  );
}

function CommunityFaces() {
  return (
    <div className="flex -space-x-2.5" aria-hidden="true">
      {communityFaces.map((face) => (
        <div
          key={face.name}
          className="h-9 w-9 overflow-hidden rounded-full border-2 border-paper bg-[#f0e5d8] shadow-sm"
        >
          <img src={face.imageSrc} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function TrustIcon({ title }: { title: string }) {
  if (title === "Verified members") {
    return <span className="text-lg">✓</span>;
  }
  if (title === "Private by design") {
    return <span className="text-lg">⌂</span>;
  }
  return <span className="text-lg">◌</span>;
}
