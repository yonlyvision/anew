/**
 * Check Supabase auth email/SMTP configuration (no secrets printed).
 * Run: npm run supabase:smtp-status
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const token = process.env.SUPABASE_ACCESS_TOKEN || loadEnv().SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const ref = "ezoptldbgatxbgaowgtv";
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!res.ok) {
  console.error("Failed to read auth config:", res.status, await res.text());
  process.exit(1);
}

const cfg = await res.json();
console.log("Supabase email / SMTP status");
console.log("---");
console.log("external_email_enabled:", cfg.external_email_enabled ?? false);
console.log("smtp_host configured:", Boolean(cfg.smtp_host));
console.log("smtp_user configured:", Boolean(cfg.smtp_user));
console.log("smtp_admin_email:", cfg.smtp_admin_email || "(not set — use support@inm8tebook.net)");
console.log("smtp_sender_name:", cfg.smtp_sender_name || "(not set)");
console.log("mailer_autoconfirm (skip email confirm on signup):", cfg.mailer_autoconfirm ?? false);
console.log("---");
if (!cfg.smtp_host) {
  console.log("SMTP not configured yet. Add SMTP_* vars to .env and run: npm run supabase:smtp-config");
} else {
  console.log("Custom SMTP appears configured.");
}
