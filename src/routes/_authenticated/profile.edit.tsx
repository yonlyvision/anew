import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { useSignedPhotoUrls } from "@/hooks/useSignedPhotoUrl";
import { PROFILE_PROMPTS, upsertProfilePrompts } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile — Anew" }, { name: "robots", content: "noindex" }] }),
  component: EditProfilePage,
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

const empty: Form = {
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
};

const interestSuggestions = [
  "Coffee shops",
  "Live music",
  "Weekend trips",
  "Cooking",
  "Fitness",
  "Long walks",
  "Books",
  "Museums",
  "Wine nights",
  "Design",
] as const;

const valueSuggestions = [
  "Honesty",
  "Kindness",
  "Depth",
  "Consistency",
  "Humor",
  "Family",
  "Growth",
  "Adventure",
  "Faith",
  "Warmth",
] as const;

const goalOptions = [
  { value: "long_term", label: "A long-term partner" },
  { value: "friendship", label: "Friendship first" },
  { value: "open_to_explore", label: "Open to explore" },
  { value: "marriage", label: "Marriage" },
] as const;

function EditProfilePage() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [photos, setPhotos] = useState<string[]>([]);
  const [primary, setPrimary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const savePromptsFn = useServerFn(upsertProfilePrompts);
  const { urls: photoUrls } = useSignedPhotoUrls(photos);

  useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select(
        "first_name,date_of_birth,gender,dating_preference,city,country,bio,relationship_goal,interests,values,new_chapter_answer,open_to_second_chance,photos,primary_photo"
      )
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setForm({
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
      });
      setPhotos(data.photos ?? []);
      setPrimary(data.primary_photo ?? null);
    }

    const { data: promptRows } = await supabase
      .from("profile_prompts")
      .select("prompt_key,answer")
      .eq("user_id", userId);
    const answers: Record<string, string> = {};
    for (const row of promptRows ?? []) answers[row.prompt_key] = row.answer;
    setPromptAnswers(answers);

    setLoading(false);
  }

  const interests = useMemo(() => splitList(form.interests), [form.interests]);
  const values = useMemo(() => splitList(form.values), [form.values]);
  const activePromptCount = useMemo(
    () => PROFILE_PROMPTS.filter((prompt) => promptAnswers[prompt.key]?.trim()).length,
    [promptAnswers],
  );
  const completion = useMemo(() => {
    const filled = [
      form.first_name,
      form.date_of_birth,
      form.gender,
      form.dating_preference,
      form.city,
      form.bio,
      form.relationship_goal,
      form.new_chapter_answer,
    ].filter((value) => String(value ?? "").trim().length > 0).length;
    return Math.round((filled / 8) * 100);
  }, [form]);

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

  function urlFor(path: string) {
    return photoUrls[path] ?? "";
  }

  async function onUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    if (photos.length >= 6) {
      toast.error("Maximum 6 photos");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/photo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const nextPhotos = [...photos, path];
      const nextPrimary = primary ?? path;
      const { error } = await supabase
        .from("profiles")
        .update({ photos: nextPhotos, primary_photo: nextPrimary })
        .eq("id", userId);
      if (error) throw error;

      setPhotos(nextPhotos);
      setPrimary(nextPrimary);
      toast.success("Photo added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(path: string) {
    const nextPhotos = photos.filter((photo) => photo !== path);
    const nextPrimary = primary === path ? nextPhotos[0] ?? null : primary;
    const { error } = await supabase
      .from("profiles")
      .update({ photos: nextPhotos, primary_photo: nextPrimary })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from("profile-photos").remove([path]);
    setPhotos(nextPhotos);
    setPrimary(nextPrimary);
  }

  async function makePrimary(path: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ primary_photo: path })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPrimary(path);
  }

  async function save() {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
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
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    const filledPrompts = PROFILE_PROMPTS.filter((prompt) => promptAnswers[prompt.key]?.trim());
    if (filledPrompts.length > 0) {
      await savePromptsFn({
        data: {
          prompts: filledPrompts.map((prompt) => ({
            promptKey: prompt.key,
            answer: promptAnswers[prompt.key].trim(),
          })),
        },
      });
    }

    toast.success("Profile saved");
    navigate({ to: "/profile" });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/profile" className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink">
          ← Back
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="text-[11px] uppercase tracking-[0.25em] text-ink/50 hover:text-ink"
          >
            View profile
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-paper transition-colors hover:bg-accent disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Profile studio
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-6xl">
            Refine how people experience you.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
            The strongest profiles feel easy to trust and easy to respond to.
            Add better signals, improve your photos, and sharpen the details
            that make conversation more natural.
          </p>

          <div className="mt-8 rounded-[2rem] border border-ink/8 bg-card/88 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)] md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Profile strength
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight">{completion}% complete</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-ink/58">
                  Better discovery happens when your story, values, and photos
                  work together instead of competing for attention.
                </p>
              </div>
              <div className="w-full max-w-xs">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-ink/44">
                  <span>Current momentum</span>
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

            <div className="mt-8 space-y-5">
              <EditorBlock
                title="Photos"
                hint="Warm, clear photos do more work than a longer bio ever will. You can upload up to 6."
              >
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem]">
                  <div className="overflow-hidden rounded-[1.7rem] border border-ink/8 bg-muted-warm">
                    {primary && urlFor(primary) ? (
                      <img src={urlFor(primary)} alt="" className="aspect-[5/4] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[5/4] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,_rgba(255,245,232,0.95),_transparent_22%),radial-gradient(circle_at_76%_18%,_rgba(229,98,84,0.24),_transparent_24%),linear-gradient(180deg,_rgba(229,189,161,0.72),_rgba(104,79,67,0.92))]">
                        <span className="font-serif text-7xl text-paper/90">
                          {(form.first_name?.trim().charAt(0) || "?").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4 border-t border-ink/8 bg-paper px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-ink">Primary photo</p>
                        <p className="mt-1 text-xs text-ink/50">
                          This is the first image people see in discovery.
                        </p>
                      </div>
                      <span className="rounded-full border border-accent/18 bg-accent/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">
                        Lead image
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                    {photos.map((photo) => (
                      <div key={photo} className="relative overflow-hidden rounded-[1.2rem] border border-ink/8 bg-muted-warm">
                        <img src={urlFor(photo)} alt="" className="aspect-square w-full object-cover" />
                        {primary === photo && (
                          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-paper">
                            Primary
                          </span>
                        )}
                        <div className="absolute inset-x-2 bottom-2 flex gap-2">
                          {primary !== photo && (
                            <button
                              type="button"
                              onClick={() => makePrimary(photo)}
                              className="flex-1 rounded-full bg-paper/90 px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-ink backdrop-blur transition-colors hover:bg-ink hover:text-paper"
                            >
                              Lead
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(photo)}
                            className="rounded-full bg-paper/90 px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-destructive backdrop-blur transition-colors hover:bg-destructive hover:text-paper"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {photos.length < 6 && (
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[1.2rem] border border-dashed border-ink/16 bg-paper text-center text-[11px] uppercase tracking-[0.22em] text-ink/50 transition-colors hover:border-ink/28 hover:text-ink">
                        {uploading ? "Uploading…" : "Add photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </EditorBlock>

              <EditorBlock title="Basics">
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
              </EditorBlock>

              <EditorBlock title="Location">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="City" value={form.city} onChange={(value) => update("city", value)} />
                  <TextField
                    label="Country"
                    value={form.country}
                    onChange={(value) => update("country", value)}
                  />
                </div>
              </EditorBlock>

              <EditorBlock
                title="Voice"
                hint="Profiles become more memorable when they sound like a person, not a checklist."
              >
                <TextArea
                  label="Short bio"
                  rows={5}
                  value={form.bio}
                  onChange={(value) => update("bio", value)}
                  placeholder="A few honest sentences about who you are right now."
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
                  placeholder="Add the values people should feel from you"
                />
              </EditorBlock>

              <EditorBlock title="Intent">
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
                    I am open to meeting someone who is starting a new chapter in life.
                  </span>
                </label>
              </EditorBlock>

              <EditorBlock
                title="Conversation starters"
                hint="Prompts make first messages easier and help your profile sound alive."
              >
                {PROFILE_PROMPTS.map((prompt) => (
                  <TextArea
                    key={prompt.key}
                    label={prompt.label}
                    rows={3}
                    value={promptAnswers[prompt.key] ?? ""}
                    onChange={(value) =>
                      setPromptAnswers((current) => ({ ...current, [prompt.key]: value }))
                    }
                  />
                ))}
              </EditorBlock>

              <EditorBlock title="Your new chapter">
                <TextArea
                  label="My new chapter"
                  rows={7}
                  value={form.new_chapter_answer}
                  onChange={(value) => update("new_chapter_answer", value)}
                  placeholder="What you've learned. What you're building. Who you want beside you."
                />
              </EditorBlock>
            </div>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-ink/8 bg-paper/92 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
              Live profile preview
            </p>
            <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-ink/8 bg-gradient-to-br from-[#fff7f2] via-[#fffdfa] to-[#f7faf8]">
              <div className="h-44 bg-[radial-gradient(circle_at_28%_18%,_rgba(255,245,232,0.95),_transparent_20%),radial-gradient(circle_at_78%_18%,_rgba(46,138,146,0.22),_transparent_24%),linear-gradient(180deg,_rgba(229,189,161,0.72),_rgba(104,79,67,0.92))]">
                {primary && urlFor(primary) ? (
                  <img src={urlFor(primary)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
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
                  {form.bio?.trim() || "Your bio appears here as you write it."}
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
                        className="rounded-full border border-accent/16 bg-accent/8 px-3 py-1 text-xs text-accent"
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
                Strong signals
              </p>
              <div className="mt-3 space-y-2">
                <PreviewSignal active={photos.length >= 3}>A healthy photo set</PreviewSignal>
                <PreviewSignal active={values.length >= 3}>Readable values</PreviewSignal>
                <PreviewSignal active={interests.length >= 3}>Conversation material</PreviewSignal>
                <PreviewSignal active={activePromptCount >= 2}>Prompt-led personality</PreviewSignal>
                <PreviewSignal active={form.new_chapter_answer.trim().length >= 40}>
                  Emotional texture
                </PreviewSignal>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function EditorBlock({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.8rem] border border-ink/8 bg-paper/92 p-5 md:p-6">
      <div>
        <h3 className="font-serif text-2xl leading-tight text-ink">{title}</h3>
        {hint ? <p className="mt-2 text-sm leading-7 text-ink/56">{hint}</p> : null}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
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
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClassName}>
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

function PreviewSignal({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${active ? "bg-teal" : "bg-ink/18"}`} />
      <p className={`text-sm ${active ? "text-ink/70" : "text-ink/42"}`}>{children}</p>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">{children}</span>;
}

const fieldClassName =
  "w-full rounded-[1.2rem] border border-ink/10 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none";
