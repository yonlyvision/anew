import { readFileSync, rmSync, mkdirSync, writeFileSync, copyFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";

const docx = process.argv[2];
if (!docx) {
  console.error("Usage: node scripts/extract-docx-text.mjs path/to/file.docx");
  process.exit(1);
}

const outDir = join(tmpdir(), "disclaimer-docx-extract");
const zipPath = join(tmpdir(), "disclaimer-temp.zip");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyFileSync(docx, zipPath);

execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" }
);

const xml = readFileSync(join(outDir, "word", "document.xml"), "utf8");
const text = xml
  .replace(/<w:tab\/>/g, "\t")
  .replace(/<w:br[^>]*\/>/g, "\n")
  .replace(/<\/w:p>/g, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

writeFileSync("setup/disclaimer-source.txt", text, "utf8");
console.log(text);
