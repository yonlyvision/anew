/**
 * Create a Turnstile widget via Cloudflare API and append keys to .env.
 *
 * Auth (pick one) in .env:
 *   A) CLOUDFLARE_EMAIL + CLOUDFLARE_GLOBAL_API_KEY  (Global API Key)
 *   B) CLOUDFLARE_EMAIL + CLOUDFLARE_API_TOKEN       (Global key stored under TOKEN name)
 *   C) CLOUDFLARE_API_TOKEN only                     (scoped API token, Bearer)
 *   Always: CLOUDFLARE_ACCOUNT_ID
 *
 * Run: npm run cloudflare:turnstile-setup
 */
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnvFile, cloudflareAuthHeaders, cloudflareAuthMode } from "./cloudflare-auth.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

const DOMAINS = [
  "connections.inm8tebook.net",
  "anew-coral.vercel.app",
  "localhost",
  "127.0.0.1",
];

function upsertEnv(keys) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  if (content.length && !content.endsWith("\n")) content += "\n";

  for (const [key, value] of Object.entries(keys)) {
    const re = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    if (re.test(content)) {
      content = content.replace(re, line);
    } else {
      content += `\n# Turnstile (auto-created ${new Date().toISOString().slice(0, 10)})\n${line}\n`;
    }
  }
  writeFileSync(envPath, content, "utf8");
}

const env = loadEnvFile();
const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
const headers = cloudflareAuthHeaders(env);
const mode = cloudflareAuthMode(env);

if (!headers || !accountId) {
  console.error(
    "Missing Cloudflare credentials in .env.\n\n" +
      "Global API Key (what you have):\n" +
      "  CLOUDFLARE_EMAIL=your@cloudflare-login-email\n" +
      "  CLOUDFLARE_GLOBAL_API_KEY=...   (or keep key in CLOUDFLARE_API_TOKEN)\n" +
      "  CLOUDFLARE_ACCOUNT_ID=...\n\n" +
      "Scoped API token (narrower, recommended for handoff later):\n" +
      "  CLOUDFLARE_API_TOKEN=...\n" +
      "  CLOUDFLARE_ACCOUNT_ID=...\n\n" +
      "Save .env, then: npm run cloudflare:turnstile-setup\n"
  );
  process.exit(1);
}

console.log(`Creating Turnstile widget (auth: ${mode})…`);

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/challenges/widgets`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Anew — apply / auth / contact",
      mode: "managed",
      domains: DOMAINS,
    }),
  }
);

const body = await res.json();

if (!body.success) {
  console.error("Cloudflare API error:", JSON.stringify(body.errors ?? body, null, 2));
  if (mode === "api_token") {
    console.error(
      "\nIf you used a Global API Key, add CLOUDFLARE_EMAIL=... to .env as well."
    );
  }
  process.exit(1);
}

const { sitekey, secret } = body.result;
if (!sitekey || !secret) {
  console.error("Unexpected API response — no sitekey/secret");
  process.exit(1);
}

upsertEnv({
  VITE_TURNSTILE_SITE_KEY: sitekey,
  TURNSTILE_SECRET_KEY: secret,
});

console.log("Turnstile widget created.");
console.log("  Domains:", DOMAINS.join(", "));
console.log("  Keys written to .env (VITE_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY)");
console.log("\nNext:");
console.log("  npm run vercel:sync-env");
console.log("  npx vercel --prod --scope leucherinb-9211s-projects");
