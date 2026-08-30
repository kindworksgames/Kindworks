import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import {
  renderPhase8ADependencyOrder,
  renderPhase8APackageJson,
  renderPhase8APromptBook,
  renderPhase8ARuntimeModule,
} from "./lib/phase8aProductionPackageRenderer.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const output = resolve(root, "artwork/production/phase-8a");
await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(resolve(output, "vertical-slice-production-package.v1.json"), renderPhase8APackageJson(PHASE_8A_VERTICAL_SLICE_PACKAGE)),
  writeFile(resolve(output, "GENERATOR_PROMPTS.md"), renderPhase8APromptBook(PHASE_8A_VERTICAL_SLICE_PACKAGE)),
  writeFile(resolve(output, "DEPENDENCY_ORDER.md"), renderPhase8ADependencyOrder(PHASE_8A_VERTICAL_SLICE_PACKAGE)),
  writeFile(resolve(root, "src/visual/generated/phase8aVerticalSliceRuntime.js"), renderPhase8ARuntimeModule(PHASE_8A_VERTICAL_SLICE_PACKAGE)),
]);
console.log("Phase 8A production JSON, generator prompt book, and dependency order exported.");
