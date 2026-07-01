/**
 * Set a specific password for an auth user (service role).
 * Run: node scripts/set-user-password.mjs user@example.com "NewPassword"
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.argv[2] || "").trim().toLowerCase();
const password = process.argv[3] || "";

if (!email || !password) {
  console.error('Usage: node scripts/set-user-password.mjs user@example.com "Password"');
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

const admin = createClient(
  loadEnv().SUPABASE_URL,
  loadEnv().SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

let user = null;
for (let page = 1; page <= 10; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("listUsers failed:", error.message);
    process.exit(1);
  }
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (user || data.users.length < 200) break;
}

if (!user) {
  console.error("No auth user for:", email);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
  user_metadata: { ...user.user_metadata, must_change_password: false },
});

if (error) {
  console.error("Update failed:", error.message);
  process.exit(1);
}

console.log("Password updated for", email);
console.log("must_change_password cleared.");
