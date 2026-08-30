import { access, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { PHASE_8B_REFERENCE_FILE } from "./lib/phase8bCandidateWorkflow.mjs";
import { inspectImageFile } from "./lib/artworkPipelineValidation.mjs";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const semanticId = valueAfter("--asset");
const file = valueAfter("--file");
const asset = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find((entry) => entry.semanticId === semanticId);
if (!asset) throw new Error(`Unknown candidate asset ID: ${semanticId}`);
if (!file?.startsWith("artwork/references/")) throw new Error("Reference files must be beneath artwork/references/.");
const absolute = resolve(root, file);
await access(absolute);
const metadata = await inspectImageFile(absolute);
if (metadata.width !== asset.output.canvas.width || metadata.height !== asset.output.canvas.height) throw new Error(`Reference must be ${asset.output.canvas.width}x${asset.output.canvas.height}; got ${metadata.width}x${metadata.height}.`);
const path = resolve(root, PHASE_8B_REFERENCE_FILE);
const current = JSON.parse(await readFile(path, "utf8").catch(() => '{"schemaVersion":1,"references":{}}'));
const next = { schemaVersion: 1, references: { ...(current.references || {}), [semanticId]: { file } } };
const temporary = `${path}.next`;
await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8"); await rename(temporary, path);
console.log(`${semanticId}: reference assigned from ${file}. Re-run assetlab:prepare.`);
