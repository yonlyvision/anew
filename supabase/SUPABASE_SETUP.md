# Supabase setup — Anew (ezoptldbgatxbgaowgtv)

**Status (automated audit):** Database schema, storage buckets, and core tables are **already applied** on the remote project. What remains is **Auth configuration** in the Supabase dashboard (or via CLI + access token).

Run the audit anytime:

```bash
node scripts/supabase-audit.mjs
```

---

## Step 1 — Confirm schema (done if audit is all OK)

If any table shows `FAIL`, run migrations in the **SQL Editor** (Dashboard → SQL → New query):

1. Open each file in `supabase/migrations/` **in timestamp order**
2. Paste and run one at a time
3. Re-run `node scripts/supabase-audit.mjs`

Or, with Supabase CLI linked to the project:

```bash
npx supabase login
npx supabase link --project-ref ezoptldbgatxbgaowgtv
npx supabase db push
```

---

## Step 2 — Enable the signup approval hook (required)

This blocks account creation unless the email is **approved** in `applications`.

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/ezoptldbgatxbgaowgtv/auth/hooks)
2. Go to **Authentication → Hooks**
3. Under **Before User Created**, click **Enable hook**
4. Choose **Postgres function**
5. Schema: `public` · Function: `hook_require_approved_application`
6. Save

**Verify in SQL Editor** (optional):

```sql
select proname, prosecdef
from pg_proc
join pg_namespace n on n.oid = pg_proc.pronamespace
where n.nspname = 'public'
  and proname = 'hook_require_approved_application';
```

Should return one row with `prosecdef = true`.

**Verify behavior:** Try signing up at `/auth?mode=signup` with an email that has **no** approved application — signup should be rejected.

---

## Step 3 — Auth URL configuration (required)

Dashboard → **Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| **Site URL** | `https://connections.inm8tebook.net` |
| **Redirect URLs** (add each) | `https://connections.inm8tebook.net/dashboard` |
| | `https://connections.inm8tebook.net/reset-password` |
| | `http://localhost:8080/dashboard` (local dev) |
| | `http://localhost:8080/reset-password` (local dev) |

---

## Step 4 — Email settings (required for password reset)

Dashboard → **Authentication → Providers → Email**

- Enable **Email** provider
- For production: configure **Custom SMTP** (Resend, Postmark, SendGrid, etc.)
- Decide on **Confirm email**:
  - **Off** — faster founding launch; users can sign in immediately after signup
  - **On** — stricter; users must click email link first

For a small founding group, many teams start with confirm email **off** and turn it on later.

---

## Step 5 — Bootstrap admin (if not already done)

After your operator account exists in Auth:

```sql
-- Replace with your auth.users id (Dashboard → Authentication → Users → copy UUID)
insert into public.user_roles (user_id, role)
values ('YOUR-USER-UUID-HERE', 'admin')
on conflict do nothing;
```

Then sign in and open `/admin/applications`.

---

## Step 6 — Google OAuth (optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs → Credentials → OAuth 2.0 Client ID (Web)
2. Authorized redirect URI: copy from Supabase → Auth → Providers → Google
3. Paste Client ID + Secret into Supabase Google provider
4. Enable Google provider

The **Before User Created** hook still applies to Google signups once enabled.

---

## Step 7 — Storage (already OK if audit shows buckets)

Expected private buckets: `profile-photos`, `verifications`

If missing, run `supabase/migrations/20260628000000_create_storage_buckets.sql` in SQL Editor.

---

## Step 8 — Local project config

`supabase/config.toml` should reference project `ezoptldbgatxbgaowgtv` and the auth hook (for CLI sync). After linking:

```bash
npx supabase config push
```

Requires `npx supabase login` first.

---

## Step 9 — Vercel env vars (before publish)

Ensure these match the **same** Supabase project:

```
VITE_SUPABASE_URL=https://ezoptldbgatxbgaowgtv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
SUPABASE_URL=https://ezoptldbgatxbgaowgtv.supabase.co
SUPABASE_PUBLISHABLE_KEY=<same publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role — server only>
VITE_TURNSTILE_SITE_KEY=<production Turnstile>
TURNSTILE_SECRET_KEY=<production Turnstile secret>
```

---

## Quick links

| Resource | URL |
|----------|-----|
| Project dashboard | https://supabase.com/dashboard/project/ezoptldbgatxbgaowgtv |
| Auth hooks | https://supabase.com/dashboard/project/ezoptldbgatxbgaowgtv/auth/hooks |
| URL config | https://supabase.com/dashboard/project/ezoptldbgatxbgaowgtv/auth/url-configuration |
| SQL editor | https://supabase.com/dashboard/project/ezoptldbgatxbgaowgtv/sql/new |
| Users | https://supabase.com/dashboard/project/ezoptldbgatxbgaowgtv/auth/users |

---

## Client notes (before launch)

- Lawyer review of legal pages (Disclaimer, Terms, Privacy)
- Founder name + photo for `/about`
- Manual approval emails to applicants (link: `/auth?mode=signup`)
- Monitor `support@inm8tebook.net`
