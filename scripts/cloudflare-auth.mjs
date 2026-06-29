import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnvFile() {
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

/** Supports scoped API token OR legacy Global API Key + account email. */
export function cloudflareAuthHeaders(env) {
  const email = env.CLOUDFLARE_EMAIL?.trim();
  const globalKey = (
    env.CLOUDFLARE_GLOBAL_API_KEY ||
    env.CLOUDFLARE_API_KEY ||
    ""
  ).trim();

  // Global key: explicit var, or CLOUDFLARE_API_TOKEN when email is also set
  const key = globalKey || (email && env.CLOUDFLARE_API_TOKEN ? env.CLOUDFLARE_API_TOKEN.trim() : "");

  if (email && key) {
    return {
      "X-Auth-Email": email,
      "X-Auth-Key": key,
      "Content-Type": "application/json",
    };
  }

  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  return null;
}

export function cloudflareAuthMode(env) {
  const headers = cloudflareAuthHeaders(env);
  if (!headers) return "none";
  return headers["X-Auth-Email"] ? "global_api_key" : "api_token";
}
