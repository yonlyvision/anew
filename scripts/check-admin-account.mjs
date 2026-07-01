/**
 * Check whether an email can sign in and access admin (no secrets printed).
 * Run: node scripts/check-admin-account.mjs a.onlyvision@gmail.com
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.argv[2] || "").trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/check-admin-account.mjs user@example.com");
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

const env = loadEnv();
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log("Account check for:", email);
console.log("---");

// Auth user (paginate — small project)
let authUser = null;
for (let page = 1; page <= 10; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("listUsers failed:", error.message);
    process.exit(1);
  }
  authUser = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (authUser || data.users.length < 200) break;
}

if (!authUser) {
  console.log("AUTH USER: not found");
  console.log("\nLikely fix: create account at /auth?mode=signup after approving application,");
  console.log("or reset password if account existed on old Supabase project.");
} else {
  console.log("AUTH USER: exists");
  console.log("  user_id:", authUser.id);
  console.log("  email_confirmed:", !!authUser.email_confirmed_at);
  console.log("  created:", authUser.created_at?.slice(0, 10));
  const meta = authUser.user_metadata ?? {};
  console.log("  must_change_password:", meta.must_change_password === true);
}

const { data: app } = await admin
  .from("applications")
  .select("status")
  .eq("email", email)
  .maybeSingle();
console.log("\nAPPLICATION:", app ? app.status : "none");

if (authUser) {
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", authUser.id);
  const roleList = (roles ?? []).map((r) => r.role);
  console.log("ROLES:", roleList.length ? roleList.join(", ") : "(none)");
  console.log("ADMIN ACCESS:", roleList.includes("admin") || roleList.includes("moderator") ? "yes" : "no");

  if (!roleList.includes("admin") && !roleList.includes("moderator")) {
    console.log("\nLikely fix (SQL Editor):");
    console.log(`  insert into user_roles (user_id, role) values ('${authUser.id}', 'admin');`);
  }
} else if (!app || app.status !== "approved") {
  console.log("\nLikely fix: approve application first, then signup:");
  console.log(`  insert into applications (email, first_name, status) values ('${email}', 'Admin', 'approved')`);
  console.log("  on conflict (email) do update set status = 'approved';");
}

console.log("\nSign-in reminders:");
console.log("  • Use Sign in (not Create account) at /auth");
console.log("  • Complete Turnstile CAPTCHA before submitting");
console.log("  • Wrong password → use /reset-password (SMTP not configured yet — may fail)");
