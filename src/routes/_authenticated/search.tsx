import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { searchProfiles } from "@/lib/dating.functions";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search — Anew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

type Filters = {
  query: string;
  city: string;
  ageMin: string;
  ageMax: string;
  gender: "" | "woman" | "man" | "nonbinary" | "other";
  goal: "" | "long_term" | "friendship" | "open_to_explore" | "marriage";
  secondChanceOnly: boolean;
  verifiedOnly: boolean;
};

const initial: Filters = {
  query: "",
  city: "",
  ageMin: "",
  ageMax: "",
  gender: "",
  goal: "",
  secondChanceOnly: false,
  verifiedOnly: false,
};

const searchTips = [
  "Use city and goal first, then narrow further if needed.",
  "Verified-only is best when trust is your top priority.",
  "Try a single keyword from a vibe or interest instead of a long phrase.",
] as const;

function ageFromDob(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

function SearchPage() {
  const fn = useServerFn(searchProfiles);
  const [filters, setFilters] = useState<Filters>(initial);

  const searchMutation = useMutation({
    mutationFn: () =>
      fn({
        data: {
          query: filters.query || undefined,
          city: filters.city || undefined,
          ageMin: filters.ageMin ? Number(filters.ageMin) : undefined,
          ageMax: filters.ageMax ? Number(filters.ageMax) : undefined,
          gender: filters.gender || undefined,
          goal: filters.goal || undefined,
          secondChanceOnly: filters.secondChanceOnly || undefined,
          verifiedOnly: filters.verifiedOnly || undefined,
        },
      }),
  });

  const profiles = searchMutation.data?.profiles ?? [];
  const activeFilterCount = useMemo(
    () =>
      [
        filters.query,
        filters.city,
        filters.ageMin,
        filters.ageMax,
        filters.gender,
        filters.goal,
        filters.secondChanceOnly ? "1" : "",
        filters.verifiedOnly ? "1" : "",
      ].filter(Boolean).length,
    [filters],
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Search
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-6xl">
            Find someone on your wavelength.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
            Search works best when it balances chemistry with clarity. Filter
            for trust, intent, and the details that genuinely matter to you.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SearchMetric label="Filters active" value={String(activeFilterCount)}>
              The more specific you get, the narrower the pool becomes.
            </SearchMetric>
            <SearchMetric label="Best used for" value="Intent">
              This is especially useful when relationship goals matter a lot to you.
            </SearchMetric>
            <SearchMetric label="Strong combo" value="Verified + city">
              A practical way to cut noise without over-filtering.
            </SearchMetric>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchMutation.mutate();
            }}
            className="mt-10 rounded-[2rem] border border-ink/8 bg-card/88 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)] md:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Keyword">
                <input
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  placeholder="Growth, books, design…"
                  className={inputClassName}
                />
              </Field>
              <Field label="City">
                <input
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  placeholder="Toronto, Austin, London…"
                  className={inputClassName}
                />
              </Field>
              <Field label="Age range">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={filters.ageMin}
                    onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                    placeholder="Min"
                    className={inputClassName}
                  />
                  <span className="text-ink/36">–</span>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={filters.ageMax}
                    onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                    placeholder="Max"
                    className={inputClassName}
                  />
                </div>
              </Field>
              <Field label="Gender">
                <select
                  value={filters.gender}
                  onChange={(e) =>
                    setFilters({ ...filters, gender: e.target.value as Filters["gender"] })
                  }
                  className={inputClassName}
                >
                  <option value="">Any</option>
                  <option value="woman">Woman</option>
                  <option value="man">Man</option>
                  <option value="nonbinary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Looking for">
                <select
                  value={filters.goal}
                  onChange={(e) => setFilters({ ...filters, goal: e.target.value as Filters["goal"] })}
                  className={inputClassName}
                >
                  <option value="">Any goal</option>
                  <option value="long_term">Long-term partner</option>
                  <option value="friendship">Friendship first</option>
                  <option value="open_to_explore">Open to explore</option>
                  <option value="marriage">Marriage</option>
                </select>
              </Field>
              <div className="space-y-3 rounded-[1.4rem] border border-ink/8 bg-paper/85 px-4 py-4 text-sm text-ink/62">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.secondChanceOnly}
                    onChange={(e) =>
                      setFilters({ ...filters, secondChanceOnly: e.target.checked })
                    }
                  />
                  Open to second-chance dating
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  />
                  Verified members only
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={searchMutation.isPending}
                className="rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
              >
                {searchMutation.isPending ? "Searching…" : "Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(initial);
                  searchMutation.reset();
                }}
                className="rounded-full border border-ink/12 px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-ink/64 transition-colors hover:border-ink hover:text-ink"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="mt-10">
            {searchMutation.isPending && <p className="text-sm text-ink/50">Searching…</p>}
            {searchMutation.isError && (
              <p className="text-sm text-destructive">
                {searchMutation.error instanceof Error
                  ? searchMutation.error.message
                  : "Search failed"}
              </p>
            )}
            {searchMutation.isSuccess && profiles.length === 0 && (
              <div className="rounded-[2rem] border border-ink/8 bg-card/88 px-8 py-10 text-center">
                <p className="font-serif text-3xl leading-tight text-ink">
                  No one matches those filters yet.
                </p>
                <p className="mt-3 text-sm leading-7 text-ink/56">
                  Try broadening one or two criteria. City, goal, and verified
                  status tend to work better than stacking too many restrictions.
                </p>
              </div>
            )}
            {profiles.length > 0 && (
              <>
                <p className="text-[11px] uppercase tracking-[0.25em] text-ink/40">
                  {profiles.length} result{profiles.length === 1 ? "" : "s"}
                </p>
                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  {profiles.map((profile) => (
                    <SearchResultCard key={profile.id} profile={profile} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-ink/8 bg-paper/92 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
              Smart filtering
            </p>
            <div className="mt-5 space-y-3">
              {searchTips.map((tip) => (
                <TipCard key={tip}>{tip}</TipCard>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SearchResultCard({
  profile,
}: {
  profile: {
    id: string;
    first_name: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    date_of_birth: string | null;
    relationship_goal: string | null;
    primary_photo_url?: string | null;
    values: string[] | null;
    interests: string[] | null;
    new_chapter_answer: string | null;
    open_to_second_chance: boolean | null;
    selfie_verified?: boolean | null;
    email_verified?: boolean | null;
    phone_verified?: boolean | null;
    is_premium?: boolean | null;
    profile_completion?: number | null;
  };
}) {
  const age = ageFromDob(profile.date_of_birth);
  const trustCount = [
    profile.email_verified,
    profile.phone_verified,
    profile.selfie_verified,
  ].filter(Boolean).length;

  const goalLabel: Record<string, string> = {
    long_term: "Long-term partner",
    friendship: "Friendship first",
    open_to_explore: "Open to explore",
    marriage: "Marriage",
  };

  const spark = profile.new_chapter_answer ?? profile.bio ?? "";

  return (
    <Link
      to="/profile/$userId"
      params={{ userId: profile.id }}
      className="group overflow-hidden rounded-[2rem] border border-ink/8 bg-paper shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)] transition-colors hover:border-ink/18"
    >
      <div className="grid gap-0 md:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="relative min-h-[19rem] overflow-hidden bg-muted-warm">
          {profile.primary_photo_url ? (
            <img
              src={profile.primary_photo_url}
              alt={profile.first_name ?? "Profile"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,_rgba(255,245,232,0.95),_transparent_22%),radial-gradient(circle_at_76%_18%,_rgba(229,98,84,0.24),_transparent_24%),linear-gradient(180deg,_rgba(229,189,161,0.72),_rgba(104,79,67,0.92))]">
              <span className="font-serif text-7xl text-paper/90">
                {(profile.first_name?.charAt(0) || "?").toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/42 via-black/16 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {trustCount > 0 && <Badge>Verified {trustCount}/3</Badge>}
            {profile.is_premium && <Badge tone="gold">Premium</Badge>}
          </div>
          <div className="absolute right-4 top-4">
            <Badge tone="paper">{profile.profile_completion ?? 0}% complete</Badge>
          </div>
          <div className="absolute inset-x-4 bottom-4 text-paper">
            <h2 className="font-serif text-4xl leading-none">
              {profile.first_name ?? "Member"}
              {age ? <span className="ml-2 font-sans text-lg text-paper/78">{age}</span> : null}
            </h2>
            <p className="mt-2 text-sm text-paper/76">
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            {profile.relationship_goal && (
              <span className="rounded-full border border-accent/18 bg-accent/8 px-3 py-1 text-[11px] font-medium text-accent">
                {goalLabel[profile.relationship_goal] ?? profile.relationship_goal}
              </span>
            )}
            {profile.open_to_second_chance && (
              <span className="rounded-full border border-teal/18 bg-teal/8 px-3 py-1 text-[11px] font-medium text-teal">
                New chapter
              </span>
            )}
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-ink/8 bg-card/82 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal">
              Profile spark
            </p>
            <p className="mt-3 text-sm leading-7 text-ink/62">
              {spark || "Still finishing their story."}
            </p>
          </div>

          {(profile.values?.length ?? 0) > 0 && (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/42">Values</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.values!.slice(0, 4).map((value) => (
                  <span
                    key={value}
                    className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/60"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(profile.interests?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/42">Interests</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests!.slice(0, 4).map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-accent/14 bg-accent/7 px-3 py-1 text-xs text-accent"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchMetric({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-ink/8 bg-paper/88 px-5 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/44">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl leading-none text-ink">{value}</p>
      <p className="mt-3 text-sm leading-7 text-ink/58">{children}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{label}</span>
      {children}
    </label>
  );
}

function TipCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-ink/8 bg-card px-4 py-4 text-sm leading-7 text-ink/58">
      {children}
    </div>
  );
}

function Badge({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: "teal" | "gold" | "paper";
}) {
  const className =
    tone === "gold"
      ? "bg-gold/88 text-ink"
      : tone === "paper"
      ? "bg-paper/88 text-ink"
      : "bg-teal/88 text-paper";

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur ${className}`}
    >
      {children}
    </span>
  );
}

const inputClassName =
  "w-full rounded-[1.2rem] border border-ink/10 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none";
