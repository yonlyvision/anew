/**
 * Resend domain + optional Cloudflare DNS + Supabase SMTP push.
 *
 * Prerequisites in .env:
 *   RESEND_API_KEY=re_...
 *   (optional) CLOUDFLARE_* with Zone:DNS:Edit for inm8tebook.net
 *
 * Run: node scripts/resend-smtp-setup.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { cloudflareAuthHeaders, loadEnvFile } from "./cloudflare-auth.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOMAIN = "inm8tebook.net";
const FROM = "support@inm8tebook.net";

function loadEnv() {
  const env = loadEnvFile();
  const path = resolve(root, ".env");
  if (!existsSync(path)) return env;
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

function upsertEnv(key, value) {
  const path = resolve(root, ".env");
  let content = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (content.length && !content.endsWith("\n")) content += "\n";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  content = re.test(content) ? content.replace(re, line) : content + `\n${line}\n`;
  writeFileSync(path, content, "utf8");
}

const env = loadEnv();
const resendKey = env.RESEND_API_KEY?.trim();
if (!resendKey) {
  console.error("Missing RESEND_API_KEY in .env");
  console.error("Create at https://resend.com/api-keys then add: RESEND_API_KEY=re_...");
  process.exit(1);
}

console.log(`Resend setup for ${DOMAIN}`);
console.log("---");

// Create or fetch domain
let domainRes = await fetch("https://api.resend.com/domains", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${resendKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: DOMAIN, region: "us-east-1" }),
});

let domainBody = await domainRes.json();
if (!domainRes.ok && domainBody?.message?.includes("already")) {
  const list = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${resendKey}` },
  });
  const listBody = await list.json();
  domainBody = listBody.data?.find((d) => d.name === DOMAIN) ?? listBody;
  if (!domainBody?.id) {
    console.error("Domain exists but could not fetch:", JSON.stringify(listBody));
    process.exit(1);
  }
  const detail = await fetch(`https://api.resend.com/domains/${domainBody.id}`, {
    headers: { Authorization: `Bearer ${resendKey}` },
  });
  domainBody = await detail.json();
} else if (!domainRes.ok) {
  console.error("Resend domain create failed:", domainRes.status, JSON.stringify(domainBody));
  process.exit(1);
}

const records = domainBody.records ?? [];
console.log("Domain status:", domainBody.status ?? domainBody.name);
console.log("DNS records:", records.length);

const cfHeaders = cloudflareAuthHeaders(env);
if (cfHeaders && records.length) {
  const zoneRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}`,
    { headers: cfHeaders }
  );
  const zoneBody = await zoneRes.json();
  const zoneId = zoneBody.result?.[0]?.id;
  if (zoneId) {
    console.log("Cloudflare zone found — adding DNS records…");
    for (const rec of records) {
      if (rec.status === "verified") continue;
      const name = rec.name === DOMAIN ? DOMAIN : `${rec.name}.${DOMAIN}`;
      const payload = {
        type: rec.type,
        name: rec.name,
        content: rec.value.replace(/^"|"$/g, ""),
        ttl: 1,
        proxied: false,
      };
      if (rec.type === "MX" && rec.priority) payload.priority = rec.priority;
      const add = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        { method: "POST", headers: cfHeaders, body: JSON.stringify(payload) }
      );
      const addBody = await add.json();
      console.log(`  ${rec.type} ${rec.name}:`, addBody.success ? "OK" : addBody.errors?.[0]?.message ?? "failed");
    }
    await fetch(`https://api.resend.com/domains/${domainBody.id}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}` },
    });
  } else {
    console.log("Cloudflare zone not found for", DOMAIN, "— add DNS records manually in Resend dashboard.");
  }
} else {
  console.log("Add Resend DNS records manually (Cloudflare auth unavailable or no records).");
}

upsertEnv("SMTP_HOST", "smtp.resend.com");
upsertEnv("SMTP_PORT", "465");
upsertEnv("SMTP_USER", "resend");
upsertEnv("SMTP_PASS", resendKey);
upsertEnv("SMTP_ADMIN_EMAIL", FROM);
upsertEnv("SMTP_SENDER_NAME", "Anew");
upsertEnv("SMTP_AUTOCONFIRM", "true");

console.log("\nWrote SMTP_* to .env — pushing to Supabase…");
const push = spawnSync("npm", ["run", "supabase:smtp-config"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});
console.log(push.stdout || push.stderr);
process.exit(push.status ?? 1);
