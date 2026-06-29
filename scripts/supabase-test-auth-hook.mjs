/**
 * Tests whether the Before User Created hook blocks unapproved signups.
 * Run: node scripts/supabase-test-auth-hook.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
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
const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const testEmail = `hook-test-${Date.now()}@inm8tebook.net`;
const testPassword = "TestHookPass123!";

console.log("Auth hook test");
console.log("---");

// Ensure no application exists
await admin.from("applications").delete().eq("email", testEmail);

console.log("1) Signup WITHOUT approved application (should FAIL if hook is on)...");
const unapproved = await anon.auth.signUp({
  email: testEmail,
  password: testPassword,
});
if (unapproved.error) {
  console.log("   BLOCKED:", unapproved.error.message);
  console.log("   code:", unapproved.error.code, "status:", unapproved.error.status);
} else if (unapproved.data.user) {
  console.log("   ALLOWED — hook may be OFF or email confirmation pending");
  console.log("   user id:", unapproved.data.user.id);
  // cleanup user if created
  if (unapproved.data.user.id) {
    await admin.auth.admin.deleteUser(unapproved.data.user.id);
  }
}

// Approve application
await admin.from("applications").upsert({
  email: testEmail,
  first_name: "Hook",
  status: "approved",
});

console.log("2) Signup WITH approved application (should SUCCEED)...");
const approved = await anon.auth.signUp({
  email: testEmail,
  password: testPassword,
});
if (approved.error) {
  console.log("   FAILED:", approved.error.message);
} else {
  console.log("   OK — user created:", approved.data.user?.id ?? "(pending confirm)");
  if (approved.data.user?.id) {
    await admin.auth.admin.deleteUser(approved.data.user.id);
  }
}

await admin.from("applications").delete().eq("email", testEmail);
console.log("---");
console.log("Cleanup done.");
