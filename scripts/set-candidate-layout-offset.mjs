import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { PHASE_8B_LAYOUT_OVERRIDE_FILE } from "./lib/phase8bCandidateWorkflow.mjs";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const semanticId = valueAfter("--asset");
const x = Number(valueAfter("--x"));
const y = Number(valueAfter("--y"));
if (!PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.some((asset) => asset.semanticId === semanticId)) throw new Error(`Unknown candidate asset ID: ${semanticId}`);
if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("--x and --y must be finite visual offsets.");
if (Math.abs(x) > 512 || Math.abs(y) > 512) throw new Error("Visual offsets larger than 512 logical units require a layout review.");
const path = resolve(root, PHASE_8B_LAYOUT_OVERRIDE_FILE);
const current = JSON.parse(await readFile(path, "utf8").catch(() => '{"schemaVersion":1,"overrides":{}}'));
const next = { schemaVersion: 1, overrides: { ...(current.overrides || {}), [semanticId]: { x, y } } };
await mkdir(dirname(path), { recursive: true });
const temporary = `${path}.next`;
await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
await rename(temporary, path);
console.log(`${semanticId}: visual offset set to (${x}, ${y}). Re-run assetlab:prepare to refresh the Lab index.`);
