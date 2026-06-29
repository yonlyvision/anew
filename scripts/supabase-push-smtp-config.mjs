/**
 * Push custom SMTP settings to Supabase Auth via Management API.
 *
 * Add to .env (gitignored):
 *   SMTP_HOST=smtp.resend.com
 *   SMTP_PORT=465
 *   SMTP_USER=resend
 *   SMTP_PASS=re_xxxxxxxx          (Resend API key works as SMTP password)
 *   SMTP_ADMIN_EMAIL=support@inm8tebook.net
 *   SMTP_SENDER_NAME=Anew
 *
 * Resend: verify domain inm8tebook.net first, then use the API key as SMTP_PASS.
 * Run: npm run supabase:smtp-config
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = "ezoptldbgatxbgaowgtv";

function loadEnv() {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;

const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_ADMIN_EMAIL"];
const missing = required.filter((k) => !env[k]?.trim());

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env");
  process.exit(1);
}

if (missing.length) {
  console.error("Missing SMTP settings in .env:\n");
  for (const k of missing) console.error("  " + k + "=...");
  console.error(
    "\nExample (Resend — verify inm8tebook.net in Resend first):\n" +
      "  SMTP_HOST=smtp.resend.com\n" +
      "  SMTP_PORT=465\n" +
      "  SMTP_USER=resend\n" +
      "  SMTP_PASS=re_your_api_key\n" +
      "  SMTP_ADMIN_EMAIL=support@inm8tebook.net\n" +
      "  SMTP_SENDER_NAME=Anew\n\n" +
      "Save .env, then run: npm run supabase:smtp-config"
  );
  process.exit(1);
}

const patch = {
  external_email_enabled: true,
  smtp_host: env.SMTP_HOST.trim(),
  smtp_port: String(env.SMTP_PORT?.trim() || "465"),
  smtp_user: env.SMTP_USER.trim(),
  smtp_pass: env.SMTP_PASS.trim(),
  smtp_admin_email: env.SMTP_ADMIN_EMAIL.trim(),
  smtp_sender_name: (env.SMTP_SENDER_NAME || "Anew").trim(),
  // Founding launch: no confirm-email step before first sign-in
  mailer_autoconfirm: env.SMTP_AUTOCONFIRM !== "false",
};

const api = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const res = await fetch(api, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(patch),
});

if (!res.ok) {
  console.error("Failed to update SMTP config:", res.status, await res.text());
  process.exit(1);
}

const updated = await res.json();
console.log("Supabase SMTP updated:");
console.log("  smtp_host:", updated.smtp_host);
console.log("  smtp_admin_email:", updated.smtp_admin_email);
console.log("  smtp_sender_name:", updated.smtp_sender_name);
console.log("  mailer_autoconfirm:", updated.mailer_autoconfirm);
console.log("\nTest: use Forgot password at /reset-password with a real member email.");
