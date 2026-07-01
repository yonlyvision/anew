/**
 * Create or update a staff admin account with temp password + must_change_password.
 * Run: node scripts/setup-staff-admin.mjs support@inm8tebook.net "Support"
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.argv[2] || "").trim().toLowerCase();
const firstName = (process.argv[3] || "Admin").trim();

if (!email) {
  console.error('Usage: node scripts/setup-staff-admin.mjs user@example.com "First name"');
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

const tempPassword = randomBytes(12).toString("base64url").slice(0, 16) + "Aa1!";
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

if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: tempPassword,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, first_name: firstName, must_change_password: true },
  });
  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }
  console.log("Updated existing user:", email);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { first_name: firstName, must_change_password: true },
  });
  if (error) {
    console.error("Create failed:", error.message);
    process.exit(1);
  }
  user = data.user;
  console.log("Created user:", email);
}

// Approved application (for hook if they ever re-register)
await admin.from("applications").upsert(
  { email, first_name: firstName, status: "approved" },
  { onConflict: "email" }
);

// Admin role
const { data: existingRoles } = await admin
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .eq("role", "admin");

if (!existingRoles?.length) {
  const { error } = await admin.from("user_roles").insert({ user_id: user.id, role: "admin" });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    console.error("Role insert failed:", error.message);
    process.exit(1);
  }
  console.log("Granted admin role");
} else {
  console.log("Admin role already present");
}

console.log("\n--- CLIENT LOGIN ---");
console.log("Email:", email);
console.log("Temp password:", tempPassword);
console.log("URL: https://connections.inm8tebook.net/auth");
console.log("Use Sign in + complete Turnstile. Client must change password after login.");
