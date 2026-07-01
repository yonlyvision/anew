# Anew — Launch checklist

Code in this repo is **launch-ready** for a free-membership founding launch at `connections.inm8tebook.net`.  
The items below must be completed by **you (client/operator)** or your hosting dashboards before going live.

---

## 1. Supabase (required)

**Full walkthrough:** [`supabase/SUPABASE_SETUP.md`](supabase/SUPABASE_SETUP.md)

Automated audit (schema + buckets):

```bash
npm run supabase:audit
```

| Task | Where | Notes |
|------|--------|--------|
| Run all migrations | SQL Editor or `npx supabase db push` | **Audit shows schema already OK** on `ezoptldbgatxbgaowgtv` |
| **Enable signup hook** | Auth → Hooks → **Before User Created** | Function: `public.hook_require_approved_application` |
| Redirect URLs | Auth → URL configuration | Or run `npm run supabase:auth-config` with `SUPABASE_ACCESS_TOKEN` |
| Google OAuth (optional) | Auth → Providers → Google | Create OAuth client in Google Cloud Console; add Supabase callback URL |
| Email / SMTP | Auth → Email | Required for password reset; configure custom SMTP for production |
| Bootstrap admin | SQL after first account | `INSERT INTO user_roles (user_id, role) VALUES ('<your-user-uuid>', 'admin');` |

**Why the hook matters:** Without it, anyone could sign up at `/auth?mode=signup` even if their application wasn't approved. The UI checks approval, but the hook is the server-side enforcement.

---

## 2. Cloudflare Turnstile (required for production)

See **[PRE_PUBLISH_SETUP.md](PRE_PUBLISH_SETUP.md)** — Step 1.

| Variable | Scope |
|----------|--------|
| `VITE_TURNSTILE_SITE_KEY` | Vercel (build) + `.env` |
| `TURNSTILE_SECRET_KEY` | Vercel (server) + `.env` |

After adding to `.env`: `npm run vercel:sync-env`

---

## 3. Vercel deployment

See **[PRE_PUBLISH_SETUP.md](PRE_PUBLISH_SETUP.md)** — Steps 2–3.

| Task | Notes |
|------|--------|
| Env vars | `npm run vercel:sync-env` (linked to project **anew**) |
| **Supabase keys** | **Synced to production** ✓ |
| Turnstile keys | Add to `.env`, then re-run sync |
| Custom domain | `connections.inm8tebook.net` → project **anew** |
| Redeploy | `npx vercel --prod --scope leucherinb-9211s-projects` |

---

## 4. Legal & content (client)

| Item | Status in code | Client action |
|------|----------------|---------------|
| Website Disclaimer | Live at `/disclaimer` | Lawyer review before publish (banner on page) |
| Terms & Privacy | Live at `/terms`, `/privacy` | Lawyer review; confirm entity name matches records |
| Founder name + photo | Placeholder on `/about` | Send name + portrait; we'll swap the placeholder |
| Effective dates | Set to June 29, 2026 | Confirm or update before go-live |
| Registered legal entity | Code uses **LF, Sole Proprietor** (Quebec) | Confirm matches business registration |

---

## 5. Operations (client)

| Item | Notes |
|------|--------|
| Application review | Admin → `/admin/applications` — approve/deny manually |
| Approval emails | **Not automated** — email approved applicants with `/auth?mode=signup` link |
| Denial emails | Manual — no auto-send yet |
| Contact inbox | Admin → `/admin/contact` — form at `/contact` now saves to DB |
| Privacy Officer | Listed in Privacy Policy — assign a named contact |
| support@inm8tebook.net | Ensure mailbox is monitored |

---

## 6. Optional before / after launch

- Trademark search on “Anew” in Canada
- Purchase/redirect alternate domains (`anew.community`, etc.)
- Automated transactional email (Resend, Postmark) for approvals
- Stripe / paid tiers (code exists but is disabled on `/pricing`)
- New couple photography for homepage hero

---

## 7. Smoke test after deploy

1. Submit `/apply` (with Turnstile live)
2. Approve application in admin
3. Create account at `/auth?mode=signup` with approved email
4. Complete `/onboarding`
5. Sign in / sign out / password reset
6. Submit `/contact` and confirm it appears in admin inbox
7. Browse `/discover`, like, match, message (two test accounts)

---

## Environment reference

Copy `.env.example` → `.env` locally. Minimum for launch:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Do **not** commit `.env` to git.
