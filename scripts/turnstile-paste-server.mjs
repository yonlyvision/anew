/**
 * Local paste server — writes Turnstile keys from the setup page into .env.
 * Run: npm run turnstile:paste-server
 * Then open setup/paste-turnstile-keys.html and click "Save to .env".
 */
import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const htmlPath = resolve(root, "setup", "paste-turnstile-keys.html");
const PORT = 8765;

function upsertEnv(keys) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  if (content.length && !content.endsWith("\n")) content += "\n";

  for (const [key, value] of Object.entries(keys)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(content)) {
      content = content.replace(re, line);
    } else {
      content += `\n${line}\n`;
    }
  }
  writeFileSync(envPath, content, "utf8");
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(readFileSync(htmlPath, "utf8"));
    return;
  }

  if (req.method === "POST" && req.url === "/save") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const { siteKey, secretKey } = JSON.parse(body);
      if (!siteKey?.trim() || !secretKey?.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Both keys required" }));
        return;
      }
      upsertEnv({
        VITE_TURNSTILE_SITE_KEY: siteKey.trim(),
        TURNSTILE_SECRET_KEY: secretKey.trim(),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      console.log("Saved Turnstile keys to .env");
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(e) }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Turnstile paste server: http://localhost:${PORT}/`);
  console.log("Paste keys in the browser, click Save to .env, then tell the agent.");
});
