/**
 * Mark every admin/moderator account as staff-only (no member onboarding/discovery).
 * Run: node scripts/prepare-all-staff-accounts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const { data: roles, error: rolesError } = await admin
  .from("user_roles")
  .select("user_id, role")
  .in("role", ["admin", "moderator"]);

if (rolesError) {
  console.error("Failed to load staff roles:", rolesError.message);
  process.exit(1);
}

const staffIds = [...new Set((roles ?? []).map((row) => row.user_id))];
if (!staffIds.length) {
  console.log("No admin or moderator accounts found.");
  process.exit(0);
}

console.log(`Preparing ${staffIds.length} staff account(s)...`);

for (const userId of staffIds) {
  const [{ data: userData }, { data: profile, error: profileError }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("onboarding_completed,is_paused").eq("id", userId).maybeSingle(),
  ]);

  if (profileError) {
    console.error(userId, profileError.message);
    continue;
  }

  const { error } = await admin
    .from("profiles")
    .update({ onboarding_completed: true, is_paused: true })
    .eq("id", userId);

  if (error) {
    console.error(userData.user?.email ?? userId, error.message);
    continue;
  }

  console.log(
    "OK",
    userData.user?.email ?? userId,
    `(was onboarded: ${profile?.onboarding_completed ? "yes" : "no"}, paused: ${profile?.is_paused ? "yes" : "no"})`
  );
}

console.log("Done. Staff accounts skip member profile flows and stay hidden from Discover.");
