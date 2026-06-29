import { loadEnvFile, cloudflareAuthHeaders, cloudflareAuthMode } from "./cloudflare-auth.mjs";

const env = loadEnvFile();
const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
const headers = cloudflareAuthHeaders(env);
const mode = cloudflareAuthMode(env);

if (!headers) {
  console.log("No Cloudflare auth configured.");
  console.log("Need CLOUDFLARE_EMAIL + global key, or CLOUDFLARE_API_TOKEN");
  process.exit(1);
}

console.log("Auth mode:", mode);

if (mode === "global_api_key") {
  const user = await fetch("https://api.cloudflare.com/client/v4/user", { headers });
  const userBody = await user.json();
  console.log("Global key verify:", userBody.success ? "OK" : "FAILED");
  if (!userBody.success) {
    console.log("  errors:", JSON.stringify(userBody.errors));
    process.exit(1);
  }
  console.log("  email:", userBody.result?.email ?? "(ok)");
} else {
  const verify = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    headers: { Authorization: headers.Authorization },
  });
  const verifyBody = await verify.json();
  console.log("API token verify:", verifyBody.success ? "OK" : "FAILED");
  if (!verifyBody.success) {
    console.log("  errors:", JSON.stringify(verifyBody.errors));
    console.log("\nIf this is a Global API Key, add CLOUDFLARE_EMAIL=... to .env");
    process.exit(1);
  }
}

if (accountId) {
  const list = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/challenges/widgets`,
    { headers }
  );
  const listBody = await list.json();
  console.log("Turnstile access:", listBody.success ? "OK" : "FAILED");
  if (!listBody.success) {
    console.log("  errors:", JSON.stringify(listBody.errors));
  } else {
    console.log("  existing widgets:", listBody.result?.length ?? 0);
  }
}
