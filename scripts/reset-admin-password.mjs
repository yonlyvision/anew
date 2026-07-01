/**
 * Set a one-time admin password for an existing auth user (service role).
 * Writes password to .admin-temp-password (gitignored) — do not commit.
 *
 * Run: node scripts/reset-admin-password.mjs a.onlyvision@gmail.com
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.argv[2] || "").trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/reset-admin-password.mjs user@example.com");
  process.exit(1);
}

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

const tempPassword =
  randomBytes(12).toString("base64url").slice(0, 16) + "Aa1!";

const admin = createClient(
  loadEnv().SUPABASE_URL,
  loadEnv().SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

let user = null;
for (let page = 1; page <= 10; page++) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (user || data.users.length < 200) break;
}

if (!user) {
  console.error("No auth user for:", email);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, {
  password: tempPassword,
  user_metadata: { ...user.user_metadata, must_change_password: true },
});

if (error) {
  console.error("Reset failed:", error.message);
  process.exit(1);
}

const outPath = resolve(root, ".admin-temp-password");
writeFileSync(
  outPath,
  `Anew admin temp password (delete this file after use)\n\nEmail: ${email}\nPassword: ${tempPassword}\n\nSign in: https://connections.inm8tebook.net/auth\nComplete Turnstile CAPTCHA, then use Sign in (not Create account).\nYou will be prompted to change password after login.\n`,
  "utf8"
);

console.log("Password reset OK for", email);
console.log("Temp password written to:", outPath);
console.log("Open that file locally, sign in, then delete the file.");
