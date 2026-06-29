/**
 * Diagnose + repair auth hook permissions on remote Supabase.
 * Run: node scripts/supabase-diagnose-hook.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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
  if (!token) throw new Error("Missing SUPABASE_ACCESS_TOKEN in .env");

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

console.log("Auth hook diagnosis");
console.log("---");

const fn = await query(`
  select p.proname,
         p.prosecdef,
         has_function_privilege('supabase_auth_admin', p.oid, 'EXECUTE') as auth_admin_can_exec
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'hook_require_approved_application';
`);

if (!fn.length) {
  console.log("MISSING: hook function not found in public schema");
  process.exit(1);
}

console.log("Function exists:", fn[0].proname);
console.log("SECURITY DEFINER:", fn[0].prosecdef);
console.log("supabase_auth_admin EXECUTE:", fn[0].auth_admin_can_exec);

if (!fn[0].auth_admin_can_exec) {
  console.log("\nRepairing grants…");
  await query(`
    grant execute on function public.hook_require_approved_application(jsonb)
    to supabase_auth_admin;
  `);
  const recheck = await query(`
    select has_function_privilege('supabase_auth_admin', p.oid, 'EXECUTE') as auth_admin_can_exec
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'hook_require_approved_application';
  `);
  console.log("After repair, supabase_auth_admin EXECUTE:", recheck[0].auth_admin_can_exec);
}

const test = await query(`
  select public.hook_require_approved_application(
    jsonb_build_object('user', jsonb_build_object('email', 'not-approved@example.com'))
  ) as unapproved;
`);

console.log("\nDirect SQL test (unapproved should have error key):");
console.log(JSON.stringify(test[0], null, 2));

const owners = await query(`
  select pg_get_userbyid(p.proowner) as owner,
         pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'hook_require_approved_application';
`);
console.log("\nFunction owner:", owners[0]?.owner, "args:", owners[0]?.args);

const authConfigRes = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  { headers: { Authorization: `Bearer ${loadEnv().SUPABASE_ACCESS_TOKEN}` } }
);
const authConfig = await authConfigRes.json();
console.log("\nAuth hook config:");
console.log("  enabled:", authConfig.hook_before_user_created_enabled);
console.log("  uri:", authConfig.hook_before_user_created_uri);
