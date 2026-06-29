/**
 * Fix Supabase bounce warning: delete test auth users + enable autoconfirm
 * (stops signup confirmation emails on the default provider).
 *
 * Run: node scripts/supabase-email-remediation.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = "ezoptldbgatxbgaowgtv";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = env.SUPABASE_ACCESS_TOKEN;

if (!serviceKey || !accessToken) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const admin = createClient(env.SUPABASE_URL, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SAFE_EMAILS = new Set(["support@inm8tebook.net"]);

const TEST_PATTERNS = [
  /^hook-test-/i,
  /^hook_test-/i,
  /^diag-/i,
  /^test-/i,
  /^test@/i,
  /\+test@/i,
  /@example\.(com|org|net)$/i,
  /@mailinator\./i,
  /@tempmail\./i,
];

function isTestUser(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  if (SAFE_EMAILS.has(lower)) return false;
  return TEST_PATTERNS.some((re) => re.test(lower));
}

console.log("Supabase email remediation");
console.log("---\n");

// 1) List and delete test users
let page = 1;
const perPage = 200;
let deleted = 0;
let kept = 0;
const deletedEmails = [];

while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }

  for (const user of data.users) {
    const email = user.email ?? "";
    if (isTestUser(email)) {
      const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error(`  Could not delete ${email}:`, delErr.message);
      } else {
        deleted++;
        deletedEmails.push(email);
      }
    } else {
      kept++;
    }
  }

  if (data.users.length < perPage) break;
  page++;
}

console.log(`Auth users: kept ${kept}, deleted ${deleted} test/fake accounts`);
if (deletedEmails.length) {
  for (const e of deletedEmails.slice(0, 20)) console.log(`  removed: ${e}`);
  if (deletedEmails.length > 20) console.log(`  … and ${deletedEmails.length - 20} more`);
}

// 2) Enable autoconfirm — no confirmation email on signup
const authApi = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const getRes = await fetch(authApi, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
if (!getRes.ok) {
  console.error("Failed to read auth config:", getRes.status, await getRes.text());
  process.exit(1);
}

const current = await getRes.json();
console.log("\nBefore: mailer_autoconfirm =", current.mailer_autoconfirm ?? false);

const patchRes = await fetch(authApi, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ mailer_autoconfirm: true }),
});

if (!patchRes.ok) {
  console.error("Failed to enable autoconfirm:", patchRes.status, await patchRes.text());
  process.exit(1);
}

const updated = await patchRes.json();
console.log("After:  mailer_autoconfirm =", updated.mailer_autoconfirm ?? false);
console.log("\nSignup confirmation emails are now OFF (fewer bounces on default SMTP).");
console.log("Next: configure custom SMTP (Resend) for password reset — npm run supabase:smtp-config");
