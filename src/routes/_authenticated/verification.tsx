import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({
    meta: [
      { title: "Verification — Anew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerificationPage,
});

type VerificationKind = "email" | "phone" | "selfie";
type VerificationStatus = "pending" | "approved" | "rejected";

type VerificationRow = {
  id: string;
  kind: VerificationKind;
  status: VerificationStatus;
  evidence_url: string | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type ProfileFlags = {
  email_verified: boolean | null;
  phone_verified: boolean | null;
  selfie_verified: boolean | null;
};

function VerificationPage() {
  const { userId } = Route.useRouteContext();
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [flags, setFlags] = useState<ProfileFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<VerificationKind | null>(null);

  async function refresh() {
    const [{ data: verificationData }, { data: profileData }] = await Promise.all([
      supabase
        .from("verifications")
        .select("id,kind,status,evidence_url,notes,created_at,reviewed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("email_verified,phone_verified,selfie_verified")
        .eq("id", userId)
        .maybeSingle(),
    ]);
    setRows((verificationData as VerificationRow[]) ?? []);
    setFlags(profileData);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  function latestFor(kind: VerificationKind): VerificationRow | undefined {
    return rows.find((row) => row.kind === kind);
  }

  const completedCount = useMemo(() => {
    return [flags?.email_verified, flags?.phone_verified, flags?.selfie_verified].filter(Boolean)
      .length;
  }, [flags]);

  async function requestEmail() {
    setBusy("email");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error("No email on file");
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error && !error.message.toLowerCase().includes("already")) throw error;
      await supabase.from("verifications").insert({
        user_id: userId,
        kind: "email",
        notes: `Resent verification email to ${email}`,
      });
      toast.success("Verification email sent. Check your inbox.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send email");
    } finally {
      setBusy(null);
    }
  }

  async function requestPhone(form: FormData) {
    setBusy("phone");
    try {
      const phone = String(form.get("phone") ?? "").trim();
      if (phone.length < 6 || phone.length > 32) {
        throw new Error("Enter a valid phone number");
      }
      const { error } = await supabase.from("verifications").insert({
        user_id: userId,
        kind: "phone",
        notes: phone,
      });
      if (error) throw error;
      toast.success("Phone submitted. Our team will review it shortly.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(null);
    }
  }

  async function uploadSelfie(file: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo must be under 8MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setBusy("selfie");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/selfie-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("verifications")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("verifications").insert({
        user_id: userId,
        kind: "selfie",
        evidence_url: path,
      });
      if (insertError) throw insertError;
      toast.success("Selfie submitted for review.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink"
        >
          ← Back
        </Link>
        <Link
          to="/discover"
          className="text-[11px] uppercase tracking-[0.25em] text-accent hover:text-ink"
        >
          Browse profiles →
        </Link>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Trust
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-balance md:text-6xl">
            Verify your account before you go deeper.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink/62">
            Strong dating experiences feel better when trust arrives early. These
            three steps help reduce impersonation, keep the community calmer,
            and make matches feel more credible from the start.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SummaryCard label="Completed" value={`${completedCount}/3`}>
              Verified signals visible on your profile.
            </SummaryCard>
            <SummaryCard label="Review time" value="< 24 hrs">
              Most manual reviews are completed within a day.
            </SummaryCard>
            <SummaryCard label="Privacy" value="Protected">
              What you submit stays private and is only used for review.
            </SummaryCard>
          </div>

          <div className="mt-10 space-y-5">
            <VerificationStep
              title="Email"
              description="Confirm the email attached to your account. It is the fastest trust signal and helps us secure account recovery."
              status={flags?.email_verified ? "approved" : latestFor("email")?.status ?? "missing"}
              submittedAt={latestFor("email")?.created_at}
              notes={latestFor("email")?.notes}
            >
              <button
                type="button"
                onClick={requestEmail}
                disabled={busy === "email" || !!flags?.email_verified}
                className="rounded-full border border-ink/12 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {flags?.email_verified
                  ? "Verified"
                  : busy === "email"
                  ? "Sending…"
                  : "Send email"}
              </button>
            </VerificationStep>

            <VerificationStep
              title="Phone"
              description="Add a number our team can use if we need to confirm account ownership. This creates another layer of confidence for everyone."
              status={flags?.phone_verified ? "approved" : latestFor("phone")?.status ?? "missing"}
              submittedAt={latestFor("phone")?.created_at}
              notes={latestFor("phone")?.notes}
            >
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestPhone(new FormData(e.currentTarget));
                }}
              >
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+1 555 000 0000"
                  maxLength={32}
                  disabled={!!flags?.phone_verified}
                  className="flex-1 rounded-full border border-ink/12 bg-paper px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy === "phone" || !!flags?.phone_verified}
                  className="rounded-full border border-ink/12 px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {flags?.phone_verified
                    ? "Verified"
                    : busy === "phone"
                    ? "Submitting…"
                    : "Submit"}
                </button>
              </form>
            </VerificationStep>

            <VerificationStep
              title="Selfie / ID"
              description="Upload a clear selfie holding a note with today's date. We use it to confirm you match your profile photos, then remove it after review."
              status={flags?.selfie_verified ? "approved" : latestFor("selfie")?.status ?? "missing"}
              submittedAt={latestFor("selfie")?.created_at}
              notes={latestFor("selfie")?.notes}
            >
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-ink/12 px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-ink transition-colors hover:bg-ink hover:text-paper">
                {busy === "selfie"
                  ? "Uploading…"
                  : flags?.selfie_verified
                  ? "Submit again"
                  : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy === "selfie"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadSelfie(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </VerificationStep>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-ink/8 bg-paper/92 p-6 shadow-[0_24px_70px_-56px_rgba(35,25,22,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">
              Why this matters
            </p>
            <div className="mt-5 space-y-3">
              <ReasonCard title="Safer discovery">
                Trust signals help members feel more comfortable engaging with a
                profile in the first place.
              </ReasonCard>
              <ReasonCard title="Better first conversations">
                People message differently when they believe the person on the
                other side is real.
              </ReasonCard>
              <ReasonCard title="Lower friction later">
                Verifying early means fewer awkward trust questions once a match
                becomes interesting.
              </ReasonCard>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-ink/8 bg-card px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/44">
                Current progress
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-ink/60">
                {completedCount === 3
                  ? "You are fully verified. Your profile now carries the strongest trust signal we offer."
                  : completedCount > 0
                  ? "You are partway there. Completing the remaining checks will strengthen your profile."
                  : "Start with any step above. Most members begin with email, then phone, then selfie review."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function VerificationStep({
  title,
  description,
  status,
  submittedAt,
  notes,
  children,
}: {
  title: string;
  description: string;
  status: VerificationStatus | "missing";
  submittedAt?: string;
  notes?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-ink/8 bg-card/88 p-6 shadow-[0_22px_65px_-55px_rgba(35,25,22,0.45)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-3xl leading-tight">{title}</h2>
            <StatusPill status={status} />
          </div>
          <p className="mt-4 text-sm leading-7 text-ink/60">{description}</p>
          {submittedAt ? (
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-ink/42">
              Submitted {new Date(submittedAt).toLocaleDateString()}
            </p>
          ) : null}
          {status === "rejected" && notes ? (
            <p className="mt-3 rounded-[1.2rem] border border-destructive/18 bg-destructive/8 px-4 py-3 text-sm leading-7 text-destructive">
              {notes}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: VerificationStatus | "missing" }) {
  const label =
    status === "approved"
      ? "Verified"
      : status === "pending"
      ? "In review"
      : status === "rejected"
      ? "Needs attention"
      : "Not started";

  const className =
    status === "approved"
      ? "border-teal/25 bg-teal/10 text-teal"
      : status === "pending"
      ? "border-ink/14 bg-ink/6 text-ink/70"
      : status === "rejected"
      ? "border-destructive/25 bg-destructive/10 text-destructive"
      : "border-ink/10 bg-paper text-ink/45";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${className}`}
    >
      {label}
    </span>
  );
}

function SummaryCard({
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

function ReasonCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-ink/8 bg-card px-4 py-4">
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-2 text-sm leading-7 text-ink/58">{children}</p>
    </div>
  );
}
