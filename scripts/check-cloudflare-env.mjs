import { readFileSync, existsSync } from "fs";

if (!existsSync(".env")) {
  console.log("no .env");
  process.exit(1);
}

const lines = readFileSync(".env", "utf8").split(/\r?\n/);
for (const key of [
  "CLOUDFLARE_EMAIL",
  "CLOUDFLARE_GLOBAL_API_KEY",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "VITE_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
]) {
  const line = lines.find((l) => l.startsWith(`${key}=`));
  if (!line) {
    console.log(`${key}: MISSING`);
    continue;
  }
  let val = line.slice(key.length + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  const placeholder =
    /paste|your_|xxx|here/i.test(val) || val.length < 8;
  console.log(
    `${key}: set, length=${val.length}${placeholder ? " (possible placeholder?)" : ""}`
  );
}
