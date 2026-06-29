/**
 * Audits the remote Supabase project configured in .env (service role).
 * Run: node scripts/supabase-audit.mjs
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
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function checkTable(name, select = "id") {
  const { error, count } = await sb.from(name).select(select, { count: "exact", head: true });
  return { ok: !error, error: error?.message, count: count ?? 0 };
}

async function checkColumn(table, column) {
  const { error } = await sb.from(table).select(column).limit(1);
  return { ok: !error, error: error?.message };
}

console.log("Supabase audit:", url.replace(/^https:\/\//, ""));
console.log("---");

const tables = [
  "profiles",
  "applications",
  "contact_messages",
  "user_roles",
  "admin_audit_log",
  "profile_prompts",
  "likes",
  "matches",
  "messages",
  "reports",
  "verifications",
  "subscriptions",
];

for (const t of tables) {
  const r = await checkTable(t);
  console.log(`${r.ok ? "OK" : "FAIL"}  ${t.padEnd(20)} ${r.ok ? `rows=${r.count}` : r.error}`);
}

const cols = [
  ["profiles", "is_banned"],
  ["profiles", "onboarding_completed"],
  ["profiles", "profile_completion"],
];
for (const [table, col] of cols) {
  const r = await checkColumn(table, col);
  console.log(`${r.ok ? "OK" : "FAIL"}  ${table}.${col.padEnd(22)} ${r.ok ? "" : r.error}`);
}

const { data: buckets, error: bErr } = await sb.storage.listBuckets();
if (bErr) {
  console.log("FAIL  storage buckets     ", bErr.message);
} else {
  const names = (buckets ?? []).map((b) => b.name).sort().join(", ") || "(none)";
  console.log("OK    storage buckets     ", names);
}

// Hook function can't be queried via REST — note for manual check
console.log("---");
console.log("Manual dashboard checks (cannot verify via REST):");
console.log("  • Auth → Hooks → Before User Created → hook_require_approved_application");
console.log("  • Auth → URL → Site URL https://connections.inm8tebook.net");
console.log("  • Auth → URL → Redirect allowlist /dashboard, /reset-password");
