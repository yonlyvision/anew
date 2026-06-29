/**
 * Apply common auth-hook permission fixes on remote Supabase.
 * Run: node scripts/supabase-fix-hook.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = "ezoptldbgatxbgaowgtv";

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

async function query(sql) {
  const token = loadEnv().SUPABASE_ACCESS_TOKEN;
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${body}`);
  return JSON.parse(body);
}

console.log("Applying auth hook permission fixes…");

await query(`
  grant usage on schema public to supabase_auth_admin;
  grant select on public.applications to supabase_auth_admin;
  grant execute on function public.hook_require_approved_application(jsonb)
    to supabase_auth_admin;
`);

console.log("Done. Re-run: node scripts/supabase-test-auth-hook.mjs");

spawnSync("node", ["scripts/supabase-test-auth-hook.mjs"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});
