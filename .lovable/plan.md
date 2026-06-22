
# Second-Chance Connection Platform — Build Plan

A respectful dating platform for people starting a new chapter and open-minded partners. Built on TanStack Start + Lovable Cloud, with the full MVP + admin scope from the blueprint.

Because the scope is huge, this is delivered in **5 phases**. Each phase is a working milestone you can review before we continue.

---

## Phase 0 — Design direction (this turn after approval)

1. Generate **3 rendered design directions** for the home page (mature, private, trustworthy). Locked constraints: navy/beige/gold/charcoal palette family, warm human imagery, no prison visuals, soft rounded cards.
2. You pick one. That direction's tokens (colors, type, radius, spacing) become the project's design system in `src/styles.css`.

## Phase 1 — Public marketing site

All public routes from blueprint §5, each as its own TanStack route with unique `head()` metadata (SEO-friendly, shareable):

- `/` Home (hero, mission, how-it-works preview, trust preview, CTA)
- `/how-it-works`
- `/about`
- `/safety`
- `/community-values`
- `/blog` + `/blog/$slug`
- `/success-stories`
- `/pricing`
- `/faq`
- `/contact` (form posts to a server function → stored in Cloud)
- `/terms`, `/privacy`, `/cookies` (legal stubs with placeholder copy you'll replace)

Shared header + footer with the public nav. Mobile-responsive.

## Phase 2 — Lovable Cloud + auth + onboarding

Enable Lovable Cloud. Schema:

- `profiles` (linked to `auth.users`, first_name, dob, gender, dating_preference, city, bio, relationship_goal, interests[], values[], new_chapter answers, photos[], verification flags, paused, premium)
- `user_roles` + `app_role` enum (`user`, `moderator`, `admin`) with `has_role()` security-definer function
- `likes`, `matches`, `messages`, `reports`, `blocks`, `notifications`, `verifications`, `blog_posts`, `contact_messages`, `success_stories`, `subscriptions`
- RLS on every table, GRANTs to `authenticated` + `service_role`

Auth: email/password + Google sign-in (via Lovable broker). Routes:

- `/auth` (sign up + login tabs)
- `/reset-password`
- `/onboarding` (multi-step: basic → photos → bio → interests → relationship goal → "My New Chapter")

`_authenticated` layout guards everything below.

## Phase 3 — User app (member experience)

Under `/_authenticated/`:

- `/dashboard` — welcome, profile completion %, recommended matches, new likes/messages, verification status, safety reminder
- `/discover` — swipeable/card stack of profiles with respectful tags
- `/search` — filters incl. "Comfort with second-chance dating"
- `/likes` — sent / received (received blurred for free users) / mutual
- `/matches` — match list → opens conversation
- `/messages` + `/messages/$matchId` — inbox + chat, with report/block/unmatch, safety reminders, icebreaker prompts
- `/profile/$userId` — public profile view (like, message-if-matched, report, block)
- `/profile/edit` — edit profile (restricted fields locked)
- `/verification` — email/phone/selfie verification flows
- `/notifications`
- `/settings` — account, privacy, discovery, notifications, safety, subscription, pause/delete

Matching logic: mutual-like creates a `match` row → unlocks messaging. Server functions handle all writes.

## Phase 4 — Admin panel + monetization + polish

Under `/_authenticated/admin/` (gated by `has_role(admin)`):

- Dashboard (totals, signups, matches, reports, revenue)
- Users (search, suspend, ban, restore)
- Verification review queue
- Reports & safety queue
- Content moderation (photos, bios, "New Chapter" answers)
- Blog manager (CRUD posts)
- Payments & subscriptions
- Analytics

Pricing/subscriptions: Stripe integration (free + monthly/3mo/6mo/yearly premium tiers).

Final pass: accessibility, mobile polish, SEO meta on every route, legal page copy review prompt.

---

## Technical notes

- **Stack**: TanStack Start v1 + React 19 + Tailwind v4 + Lovable Cloud (Supabase) + shadcn/ui.
- **Routing**: file-based under `src/routes/`. Public routes top-level; member routes under `_authenticated/`; admin under `_authenticated/admin/`.
- **Data**: `createServerFn` with `requireSupabaseAuth` for all user reads/writes; `supabaseAdmin` only for admin actions and webhooks (loaded inside handlers).
- **Roles**: separate `user_roles` table + `has_role()` security definer (never store role on profile).
- **Storage**: Cloud storage buckets for profile photos + verification selfies (private bucket, signed URLs).
- **Auth**: email/password + Google via `lovable.auth.signInWithOAuth("google", ...)` + `configure_social_auth`.
- **Payments**: Stripe via Lovable's built-in integration (Phase 4).
- **Tone enforcement**: zero references to "inmate/prisoner/ex-con/jail" in copy or tags. All categorization uses respectful language ("new chapter", "growth-focused", "open-minded", etc.).

## What I need from you to start

1. Approve this plan.
2. After approval, I'll generate 3 design directions for the home page and ask you to pick one — that becomes the visual system for everything.
3. Then I'll build Phase 1 and check in before Phase 2.

If you'd rather collapse phases or reorder (e.g. skip blog/success-stories for v1), tell me now and I'll adjust.
