import { readFile } from "node:fs/promises";

const sourcePath = process.argv[2] || "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html";
const requested = process.argv.slice(3);
const source = await readFile(sourcePath, "utf8");
const payloadBase64 = source.match(/const EMBEDDED_POWERWASH_HTML_B64="([^"]+)"/)?.[1];
if (!payloadBase64) throw new Error("The embedded Power Washing payload was not found.");
const payload = Buffer.from(payloadBase64, "base64").toString("utf8");

function extractFunction(name) {
  const match = new RegExp(`function\\s+${name}\\s*\\(`).exec(payload);
  if (!match) return null;
  const bodyStart = payload.indexOf("{", match.index);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < payload.length; index += 1) {
    const character = payload[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (["\"", "'", "`"].includes(character)) {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}" && --depth === 0) return payload.slice(match.index, index + 1);
  }
  throw new Error(`Unterminated function: ${name}`);
}

if (requested.length) {
  for (const name of requested) {
    const body = extractFunction(name);
    if (!body) throw new Error(`Unknown protected function: ${name}`);
    console.log(`\n===== ${name} =====\n${body}`);
  }
} else {
  const names = [...payload.matchAll(/function\s+([\w$]+)\s*\(/g)].map((match) => match[1]);
  console.log(names.join("\n"));
}
