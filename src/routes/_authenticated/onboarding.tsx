import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Anew" }, { name: "robots", content: "noindex" }] }),
  component: OnboardingPage,
});

type Form = {
  first_name: string;
  date_of_birth: string;
  gender: string;
  dating_preference: string;
  city: string;
  country: string;
  bio: string;
  relationship_goal: string;
  interests: string;
  values: string;
  new_chapter_answer: string;
  open_to_second_chance: boolean;
};

const STEPS = [
  {
    key: "basics",
    label: "Basics",
    title: "Start with the essentials",
    intro: "A few details help us shape a profile that feels human, not anonymous.",
  },
  {
    key: "location",
    label: "Location",
    title: "Set the scene",
    intro: "Your city helps people picture the life you are building now.",
  },
  {
    key: "voice",
    label: "Voice",
    title: "Give people something to connect with",
    intro: "A warm bio and a few interests make the first conversation easier.",
  },
  {
    key: "goal",
    label: "Intent",
    title: "Say what kind of connection you want",
    intro: "Clarity reduces mismatches and helps the right people lean in.",
  },
  {
    key: "chapter",
    label: "Story",
    title: "Describe your new chapter",
    intro: "This is the part people remember. Honest is better than polished.",
  },
] as const;

const interestSuggestions = [
  "Weekend trips",
  "Cooking",
  "Live music",
  "Tennis",
  "Long walks",
  "Museums",
  "Coffee shops",
  "Fitness",
  "Books",
  "Design",
] as const;

const valueSuggestions = [
  "Honesty",
  "Kindness",
  "Growth",
  "Family",
  "Humor",
  "Faith",
  "Curiosity",
  "Consistency",
  "Depth",
  "Adventure",
] as const;

const goalOptions = [
  { value: "long_term", label: "A long-term partner" },
  { value: "friendship", label: "Friendship first" },
  { value: "open_to_explore", label: "Open to explore" },
  { value: "marriage", label: "Marriage" },
] as const;

function OnboardingPage() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    first_name: "",
    date_of_birth: "",
    gender: "",
    dating_preference: "",
    city: "",
    country: "",
    bio: "",
    relationship_goal: "",
    interests: "",
    values: "",
    new_chapter_answer: "",
    open_to_second_chance: false,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "first_name,date_of_birth,gender,dating_preference,city,country,bio,relationship_goal,interests,values,new_chapter_answer,open_to_second_chance"
        )
        .eq("id", userId)
        .maybeSingle();
      if (data) {
        setForm((current) => ({
          ...current,
          first_name: data.first_name ?? "",
          date_of_birth: data.date_of_birth ?? "",
          gender: (data.gender as string) ?? "",
          dating_preference: (data.dating_preference as string) ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          bio: data.bio ?? "",
          relationship_goal: (data.relationship_goal as string) ?? "",
          interests: (data.interests ?? []).join(", "),
          values: (data.values ?? []).join(", "),
          new_chapter_answer: data.new_chapter_answer ?? "",
          open_to_second_chance: data.open_to_second_chance ?? false,
        }));
      }
    })();
  }, [userId]);

  const interests = useMemo(() => splitList(form.interests), [form.interests]);
  const values = useMemo(() => splitList(form.values), [form.values]);
  const completion = Math.round((fieldsFilled(form) / 8) * 100);
  const currentStep = STEPS[step];

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleToken(key: "interests" | "values", token: string) {
    const existing = splitList(form[key]);
    const next = existing.includes(token)
      ? existing.filter((item) => item !== token)
      : [...existing, token];
    update(key, next.join(", "));
  }

  async function save(finish: boolean) {
    setSaving(true);
    setError(null);
    const payload = {
      first_name: form.first_name || null,
      date_of_birth: form.date_of_birth || null,
      gender: (form.gender || null) as never,
      dating_preference: (form.dating_preference || null) as never,
      city: form.city || null,
      country: form.country || null,
      bio: form.bio || null,
      relationship_goal: (form.relationship_goal || null) as never,
      interests,
      values,
      new_chapter_answer: form.new_chapter_answer || null,
      open_to_second_chance: form.open_to_second_chance,
      profile_completion: completion,
      onboarding_completed: finish ? true : undefined,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (finish) {
      navigate({ to: "/verification", replace: true });
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-16">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Build your profile
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-6xl">
            Let&apos;s make this feel like you.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
            Each step saves your progress. Finish your story first, then we will
            guide you into verification so trust is in place before discovery.
          </p>

          <div className="mt-8 rounded-[2rem] border border-ink/8 bg-card/88 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)] md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight">
                  {currentStep.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-ink/58">
                  {currentStep.intro}
                </p>
              </div>
              <div className="min-w-[12rem]">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-ink/45">
                  <span>Profile strength</span>
                  <span>{completion}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-2 md:grid-cols-5">
              {STEPS.map((item, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-accent/30 bg-accent/10"
                        : done
                        ? "border-teal/22 bg-teal/8"
                        : "border-ink/8 bg-paper/70"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/45">
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-sm font-medium text-ink">{item.label}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-6">
              {step === 0 && (
                <StepSection>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="First name"
                      value={form.first_name}
                      onChange={(value) => update("first_name", value)}
                    />
                    <TextField
                      label="Date of birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(value) => update("date_of_birth", value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="I am"
                      value={form.gender}
                      onChange={(value) => update("gender", value)}
                      options={[
                        { value: "woman", label: "Woman" },
                        { value: "man", label: "Man" },
                        { value: "nonbinary", label: "Non-binary" },
                        { value: "other", label: "Other" },
                        { value: "prefer_not_to_say", label: "Prefer not to say" },
                      ]}
                    />
                    <SelectField
                      label="I'd like to meet"
                      value={form.dating_preference}
                      onChange={(value) => update("dating_preference", value)}
                      options={[
                        { value: "women", label: "Women" },
                        { value: "men", label: "Men" },
                        { value: "everyone", label: "Everyone" },
                      ]}
                    />
                  </div>
                </StepSection>
              )}

              {step === 1 && (
                <StepSection>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="City"
                      value={form.city}
                      onChange={(value) => update("city", value)}
                    />
                    <TextField
                      label="Country"
                      value={form.country}
                      onChange={(value) => update("country", value)}
                    />
                  </div>
                  <Callout>
                    Location does not need to tell your whole story. It just
                    helps people understand the life you are actually living.
                  </Callout>
                </StepSection>
              )}

              {step === 2 && (
                <StepSection>
                  <TextArea
                    label="A short bio"
                    value={form.bio}
                    onChange={(value) => update("bio", value)}
                    placeholder="A few honest sentences about who you are right now."
                    rows={5}
                  />
                  <TagEditor
                    label="Interests"
                    value={form.interests}
                    onChange={(value) => update("interests", value)}
                    suggestions={interestSuggestions}
                    selected={interests}
                    onToggle={(token) => toggleToken("interests", token)}
                    placeholder="Add a few things you genuinely enjoy"
                  />
                  <TagEditor
                    label="Values"
                    value={form.values}
                    onChange={(value) => update("values", value)}
                    suggestions={valueSuggestions}
                    selected={values}
                    onToggle={(token) => toggleToken("values", token)}
                    placeholder="Add a few values you want someone to feel"
                  />
                </StepSection>
              )}

              {step === 3 && (
                <StepSection>
                  <div className="space-y-3">
                    <Label>Relationship goal</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {goalOptions.map((option) => {
                        const active = form.relationship_goal === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => update("relationship_goal", option.value)}
                            className={`rounded-[1.4rem] border px-4 py-4 text-left transition-colors ${
                              active
                                ? "border-accent/30 bg-accent/10"
                                : "border-ink/8 bg-paper hover:border-ink/20"
                            }`}
                          >
                            <p className="text-base font-medium text-ink">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="flex items-start gap-3 rounded-[1.4rem] border border-ink/8 bg-paper px-4 py-4">
                    <input
                      type="checkbox"
                      checked={form.open_to_second_chance}
                      onChange={(e) => update("open_to_second_chance", e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm leading-7 text-ink/62">
                      I am open to meeting someone who is also entering a new chapter in life.
                    </span>
                  </label>
                </StepSection>
              )}

              {step === 4 && (
                <StepSection>
                  <Callout>
                    Try starting with what changed, what you learned, or the kind
                    of relationship you want to build differently now.
                  </Callout>
                  <TextArea
                    label="My new chapter"
                    value={form.new_chapter_answer}
                    onChange={(value) => update("new_chapter_answer", value)}
                    placeholder="What I have learned. What I am building. Who I want beside me."
                    rows={7}
                  />
                </StepSection>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  disabled={step === 0 || saving}
                  onClick={() => setStep((current) => Math.max(current - 1, 0))}
                  className="text-[11px] uppercase tracking-[0.25em] text-ink/50 transition-colors hover:text-ink disabled:opacity-30"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save(step === STEPS.length - 1)}
                  className="rounded-full bg-ink px-7 py-3 text-[11px] uppercase tracking-[0.28em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : step === STEPS.length - 1
                    ? "Finish & verify"
                    : "Save & continue"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-ink/8 bg-paper/92 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
              Live preview
            </p>
            <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-ink/8 bg-gradient-to-br from-[#fff7f2] via-[#fffdfb] to-[#f6faf7]">
              <div className="h-40 bg-[radial-gradient(circle_at_30%_25%,_rgba(255,243,223,0.92),_transparent_22%),radial-gradient(circle_at_75%_18%,_rgba(46,138,146,0.20),_transparent_24%),linear-gradient(180deg,_rgba(233,192,154,0.72),_rgba(113,89,72,0.9))]" />
              <div className="-mt-9 px-5 pb-6">
                <div className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-paper bg-gradient-to-br from-[#f6d8cf] to-[#d67e64] font-serif text-3xl text-ink shadow-sm">
                  {(form.first_name?.trim().charAt(0) || "?").toUpperCase()}
                </div>
                <h3 className="mt-4 font-serif text-3xl leading-tight text-ink">
                  {form.first_name?.trim() || "Your name"}
                </h3>
                <p className="mt-1 text-sm text-ink/50">
                  {[form.city, form.country].filter(Boolean).join(", ") || "Your location"}
                </p>
                {form.relationship_goal && (
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                    {goalOptions.find((option) => option.value === form.relationship_goal)?.label}
                  </p>
                )}
                <p className="mt-4 text-sm leading-7 text-ink/62">
                  {form.bio?.trim() || "Your short bio will appear here as you write it."}
                </p>
                {values.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {values.slice(0, 4).map((value) => (
                      <span
                        key={value}
                        className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/60"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                )}
                {interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {interests.slice(0, 4).map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-accent/18 bg-accent/8 px-3 py-1 text-xs text-accent"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
                {form.new_chapter_answer.trim() && (
                  <div className="mt-5 rounded-[1.2rem] border border-ink/8 bg-paper px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-ink/42">
                      New chapter
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink/62">
                      {form.new_chapter_answer.trim()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-ink/8 bg-card px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/44">
                Your strongest profile signals
              </p>
              <div className="mt-3 space-y-2">
                <PreviewSignal active={!!form.relationship_goal}>
                  Clear relationship goal
                </PreviewSignal>
                <PreviewSignal active={values.length >= 3}>Values people can feel</PreviewSignal>
                <PreviewSignal active={interests.length >= 3}>
                  Interests that create conversation
                </PreviewSignal>
                <PreviewSignal active={form.new_chapter_answer.trim().length >= 40}>
                  A story with emotional texture
                </PreviewSignal>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function fieldsFilled(form: Form): number {
  const keys: (keyof Form)[] = [
    "first_name",
    "date_of_birth",
    "gender",
    "dating_preference",
    "city",
    "bio",
    "relationship_goal",
    "new_chapter_answer",
  ];
  return keys.filter((key) => String(form[key] ?? "").trim().length > 0).length;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function StepSection({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClassName}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClassName} min-h-[7rem] leading-7`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClassName}
      >
        <option value="">Choose one</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagEditor({
  label,
  value,
  onChange,
  suggestions,
  selected,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  selected: string[];
  onToggle: (token: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <Label>{label}</Label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClassName}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((token) => {
          const active = selected.includes(token);
          return (
            <button
              key={token}
              type="button"
              onClick={() => onToggle(token)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-ink/10 bg-paper text-ink/60 hover:border-ink/20 hover:text-ink"
              }`}
            >
              {token}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-teal/15 bg-teal/8 px-4 py-4 text-sm leading-7 text-ink/62">
      {children}
    </div>
  );
}

function PreviewSignal({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          active ? "bg-teal" : "bg-ink/18"
        }`}
      />
      <p className={`text-sm ${active ? "text-ink/70" : "text-ink/42"}`}>{children}</p>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{children}</span>
  );
}

const fieldClassName =
  "w-full rounded-[1.2rem] border border-ink/10 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none";
