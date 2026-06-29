/**
 * Push auth URL + Before User Created hook to remote Supabase via Management API.
 *
 * Prerequisites:
 *   1. Create a personal access token: https://supabase.com/dashboard/account/tokens
 *   2. Add to .env (gitignored): SUPABASE_ACCESS_TOKEN=sbp_...
 *      Or set in the shell for one run only (see below).
 *
 * Run: npm run supabase:auth-config
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
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

const fileEnv = loadEnvFile();
const PROJECT_REF = "ezoptldbgatxbgaowgtv";
const token = process.env.SUPABASE_ACCESS_TOKEN || fileEnv.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN.\n\n" +
      "Do NOT paste tokens in chat. Add this line to your local .env file (already gitignored):\n\n" +
      "  SUPABASE_ACCESS_TOKEN=sbp_your_token_here\n\n" +
      "Then run: npm run supabase:auth-config\n\n" +
      "One-off alternative (PowerShell, token stays in your terminal only):\n" +
      "  $env:SUPABASE_ACCESS_TOKEN = \"sbp_...\"\n" +
      "  npm run supabase:auth-config\n\n" +
      "Manual setup: supabase/SUPABASE_SETUP.md"
  );
  process.exit(1);
}

const api = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const getRes = await fetch(api, { headers: { Authorization: headers.Authorization } });
if (!getRes.ok) {
  console.error("Failed to read auth config:", getRes.status, await getRes.text());
  process.exit(1);
}

const current = await getRes.json();
console.log("Current hook enabled:", current.hook_before_user_created_enabled ?? false);
console.log("Current site URL:", current.site_url ?? "(unset)");

const patch = {
  site_url: "https://connections.inm8tebook.net",
  uri_allow_list:
    "https://connections.inm8tebook.net/dashboard,https://connections.inm8tebook.net/reset-password,http://localhost:8080/dashboard,http://localhost:8080/reset-password",
  hook_before_user_created_enabled: true,
  hook_before_user_created_uri:
    "pg-functions://postgres/public/hook_require_approved_application",
  mailer_autoconfirm: true,
};

const patchRes = await fetch(api, {
  method: "PATCH",
  headers,
  body: JSON.stringify(patch),
});

if (!patchRes.ok) {
  console.error("Failed to update auth config:", patchRes.status, await patchRes.text());
  console.error(
    "\nIf the API rejects hook config, enable it manually in the dashboard:\n" +
      `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/hooks`
  );
  process.exit(1);
}

const updated = await patchRes.json();
console.log("\nAuth config updated:");
console.log("  site_url:", updated.site_url);
console.log("  hook_before_user_created_enabled:", updated.hook_before_user_created_enabled);
console.log("  hook_before_user_created_uri:", updated.hook_before_user_created_uri);
console.log("\nNext: run node scripts/supabase-audit.mjs and test signup at /auth?mode=signup");
