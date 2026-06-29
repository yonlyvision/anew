/**
 * Sync production env vars from .env to Vercel project "anew".
 *
 * Skips: SUPABASE_ACCESS_TOKEN, SMTP_*, VITE_SUPABASE_PROJECT_ID
 * Requires: vercel CLI logged in (npx vercel whoami)
 *
 * Run: npm run vercel:sync-env
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERCEL_PROJECT = process.env.VERCEL_PROJECT_NAME || "anew";
const VERCEL_SCOPE = process.env.VERCEL_SCOPE || "leucherinb-9211s-projects";

const vercelArgs = ["--scope", VERCEL_SCOPE, "--yes"];

const SKIP = new Set([
  "SUPABASE_ACCESS_TOKEN",
  "VITE_SUPABASE_PROJECT_ID",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_ADMIN_EMAIL",
  "SMTP_SENDER_NAME",
  "SMTP_AUTOCONFIRM",
]);

const SYNC_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
];

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
const supabaseKeys = SYNC_KEYS.filter((k) => !k.includes("TURNSTILE"));
const turnstileKeys = SYNC_KEYS.filter((k) => k.includes("TURNSTILE"));

const missingSupabase = supabaseKeys.filter((k) => !env[k]?.trim());
const missingTurnstile = turnstileKeys.filter((k) => !env[k]?.trim());

console.log(`Vercel sync → project "${VERCEL_PROJECT}" (${VERCEL_SCOPE})\n`);

if (missingSupabase.length) {
  console.error("Missing Supabase keys in .env:");
  for (const k of missingSupabase) console.error("  " + k);
  process.exit(1);
}

if (missingTurnstile.length) {
  console.warn("Turnstile keys not in .env yet — skipping (forms blocked in prod until added):");
  for (const k of missingTurnstile) console.warn("  " + k);
  console.warn("");
}

const keysToSync = SYNC_KEYS.filter((k) => env[k]?.trim());

const whoami = spawnSync("npx", ["vercel", "whoami"], { cwd: root, encoding: "utf8", shell: true });
if (whoami.status !== 0) {
  console.error("Not logged in to Vercel. Run: npx vercel login");
  process.exit(1);
}
console.log("Vercel account:", whoami.stdout.trim());

// Ensure repo is linked to the target project
const link = spawnSync(
  "npx",
  ["vercel", "link", "--project", VERCEL_PROJECT, ...vercelArgs],
  { cwd: root, encoding: "utf8", shell: true }
);
if (link.status !== 0) {
  console.error("Failed to link Vercel project:", link.stderr || link.stdout);
  process.exit(1);
}

for (const key of keysToSync) {
  if (SKIP.has(key)) continue;
  const value = env[key];
  console.log(`Setting ${key}…`);

  for (const target of ["production"]) {
    const add = spawnSync(
      "npx",
      [
        "vercel",
        "env",
        "add",
        key,
        target,
        "--value",
        value,
        "--force",
        ...vercelArgs,
      ],
      { cwd: root, encoding: "utf8", shell: true }
    );

    if (add.status !== 0) {
      console.error(`  Failed ${key} (${target}):`, add.stderr || add.stdout);
      process.exit(1);
    }
    console.log(`  ✓ ${target}`);
  }
}

console.log("\nDone (production env). Redeploy for changes to take effect:");
console.log(`  npx vercel --prod --scope ${VERCEL_SCOPE}`);
console.log("\nPreview env: add manually in Vercel dashboard if needed, or use branch-specific CLI.");
