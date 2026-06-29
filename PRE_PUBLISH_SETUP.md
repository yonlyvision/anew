# Pre-publish setup — SMTP, Turnstile, Vercel env

Do these **in order**. Everything uses your local `.env` (gitignored). **Never paste secrets in chat.**

---

## Step 1 — Cloudflare Turnstile (~3 min)

1. Open [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. **Add site**
   - Name: `Anew production`
   - Widget mode: **Managed**
   - Hostnames:
     - `connections.inm8tebook.net`
     - `anew-coral.vercel.app`
     - `localhost`
3. Copy keys into `.env`:

```
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

Save `.env`.

---

## Step 2 — Email SMTP via Resend (~10 min)

Supabase’s built-in email is rate-limited. For production password resets, use **Resend** (free tier is fine to start).

### 2a. Resend

1. [resend.com](https://resend.com) → sign up
2. **Domains** → Add `inm8tebook.net` → add the DNS records Resend gives you (in your domain registrar / Cloudflare DNS)
3. Wait until domain shows **Verified**
4. **API Keys** → Create → copy key (`re_...`)

### 2b. Add to `.env`

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_ADMIN_EMAIL=support@inm8tebook.net
SMTP_SENDER_NAME=Anew
SMTP_AUTOCONFIRM=true
```

`SMTP_AUTOCONFIRM=true` means members can sign in immediately after signup (no confirm-email link). Good for a small founding group.

Save `.env`.

### 2c. Push to Supabase

```powershell
npm run supabase:smtp-status    # check before
npm run supabase:smtp-config    # push SMTP settings
npm run supabase:smtp-status    # confirm after
```

Test: `/reset-password` with a real member email.

**Other SMTP providers** (SendGrid, Postmark, etc.) work too — use their host/port/user/pass instead.

---

## Step 3 — Vercel environment variables

Project: **`anew`** under team **`leucherinb-9211s-projects`**  
Production URL: `https://anew-coral.vercel.app` (and `connections.inm8tebook.net` when domain is attached)

### 3a. Automatic sync (recommended)

After Turnstile keys are in `.env`:

```powershell
npm run vercel:sync-env
```

This sets for **production** and **preview**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

It does **not** upload `SUPABASE_ACCESS_TOKEN` or SMTP vars (those stay local / Supabase only).

### 3b. Redeploy

```powershell
npx vercel --prod --scope leucherinb-9211s-projects --project anew
```

Env changes only apply after a new deployment.

### 3c. Manual alternative

Vercel → Project **anew** → Settings → Environment Variables — paste the same keys as local `.env`.

---

## Checklist

| Item | Command / location |
|------|---------------------|
| Turnstile keys in `.env` | Cloudflare Turnstile dashboard |
| SMTP in Supabase | `npm run supabase:smtp-config` |
| Vercel env vars | `npm run vercel:sync-env` |
| Production deploy | `npx vercel --prod ...` |
| Password reset test | `/reset-password` on live site |
| CAPTCHA test | `/apply` on live site |

---

## Client notes (still manual)

- Ensure `support@inm8tebook.net` mailbox exists and is monitored
- Resend domain DNS must stay verified
- Rotate `SUPABASE_ACCESS_TOKEN` if ever exposed — it’s setup-only, not on Vercel
