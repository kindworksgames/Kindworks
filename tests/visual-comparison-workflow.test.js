import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  VISUAL_CAPTURE_CASES,
  createSeededRandom,
  validateVisualCaptureRequest,
  validateVisualComparisonContracts,
} from "../src/qa/visualComparisonContracts.js";
import {
  REFERENCE_CONTRACTS,
  computeRgbaDifference,
  validateReferenceDescriptor,
} from "../src/visual/dev/referenceComparison.js";
import {
  approvalToken,
  approveVisualCandidate,
  compareVisualFiles,
  sha256File,
} from "../scripts/lib/visual-comparison.mjs";

test("capture contracts are complete, fixed, and fail closed", () => {
  assert.equal(validateVisualComparisonContracts().ok, true);
  assert.equal(VISUAL_CAPTURE_CASES.length, 10);
  assert.deepEqual(validateVisualCaptureRequest({ id: "town--narrow-phone", width: 568, height: 320 }).ok, true);
  assert.equal(validateVisualCaptureRequest({ id: "town--narrow-phone", width: 844, height: 390 }).code, "viewport-mismatch");
  assert.equal(validateVisualCaptureRequest({ id: "not-real", width: 568, height: 320 }).code, "unknown-capture-case");
});

test("the visual seed produces a stable random sequence", () => {
  const left = createSeededRandom();
  const right = createSeededRandom();
  assert.deepEqual(Array.from({ length: 16 }, () => left()), Array.from({ length: 16 }, () => right()));
});

test("reference association rejects unrelated and misaligned artwork", () => {
  const contract = REFERENCE_CONTRACTS["reference.fishing.reedbank"];
  assert.equal(validateReferenceDescriptor(contract, { name: "fishing-reedbank.png", type: "image/png", width: 1280, height: 720 }).ok, true);
  const wrongScene = validateReferenceDescriptor(contract, { name: "Village Grocer.png", type: "image/png", width: 1280, height: 720 });
  assert.equal(wrongScene.ok, false);
  assert.match(wrongScene.errors.join(" "), /not associated/);
  const wrongAspect = validateReferenceDescriptor(contract, { name: "fishing.png", type: "image/png", width: 1000, height: 1000 });
  assert.equal(wrongAspect.ok, false);
  assert.match(wrongAspect.errors.join(" "), /16:9/);
});

test("browser difference calculation reports measured changed pixels", () => {
  const left = new Uint8ClampedArray([10, 10, 10, 255, 20, 20, 20, 255]);
  const right = new Uint8ClampedArray([10, 10, 10, 255, 80, 20, 20, 255]);
  const result = computeRgbaDifference(left, right, { channelDeltaThreshold: 8 });
  assert.equal(result.metrics.pixelCount, 2);
  assert.equal(result.metrics.changedPixels, 1);
  assert.equal(result.metrics.changedPixelRatio, 0.5);
  assert.equal(result.metrics.maximumChannelDelta, 60);
});

test("file comparator rejects dimensions and meaningful pixel changes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "kw-visual-diff-"));
  const baseline = path.join(directory, "baseline.png");
  const exact = path.join(directory, "exact.png");
  const changed = path.join(directory, "changed.png");
  const wrongSize = path.join(directory, "wrong-size.png");
  await sharp({ create: { width: 8, height: 8, channels: 4, background: "#204060ff" } }).png().toFile(baseline);
  await sharp({ create: { width: 8, height: 8, channels: 4, background: "#204060ff" } }).png().toFile(exact);
  await sharp({ create: { width: 8, height: 8, channels: 4, background: "#f04020ff" } }).png().toFile(changed);
  await sharp({ create: { width: 9, height: 8, channels: 4, background: "#204060ff" } }).png().toFile(wrongSize);
  const policy = { channelDeltaThreshold: 8, maxChangedPixelRatio: 0, maxMeanAbsoluteError: 0 };
  assert.equal((await compareVisualFiles({ baselineFile: baseline, candidateFile: exact, policy })).ok, true);
  assert.equal((await compareVisualFiles({ baselineFile: baseline, candidateFile: changed, policy })).code, "visual-difference");
  assert.equal((await compareVisualFiles({ baselineFile: baseline, candidateFile: wrongSize, policy })).code, "dimension-mismatch");
});

test("baseline approval requires reviewer and candidate-derived token", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "kw-visual-approval-"));
  const baselineDirectory = path.join(root, "docs/qa/visual-readiness/phase-01/baselines");
  await mkdir(baselineDirectory, { recursive: true });
  const candidate = path.join(root, "candidate.jpg");
  await sharp({ create: { width: 4, height: 4, channels: 3, background: "#123456" } }).jpeg().toFile(candidate);
  const hash = await sha256File(candidate);
  const manifest = { version: 1, baselines: [] };
  const baseline = { file: "baselines/example.jpg", sha256: "old" };
  await assert.rejects(() => approveVisualCandidate({ root, manifest, baseline, candidateFile: candidate, reviewer: "", token: approvalToken(hash) }), /reviewer/);
  await assert.rejects(() => approveVisualCandidate({ root, manifest, baseline, candidateFile: candidate, reviewer: "QA", token: "wrong" }), /token mismatch/i);
  const approved = await approveVisualCandidate({ root, manifest, baseline, candidateFile: candidate, reviewer: "QA", token: approvalToken(hash), now: "2026-08-30T00:00:00.000Z" });
  assert.equal(approved.ok, true);
  assert.equal(baseline.sha256, hash);
  assert.equal(JSON.parse(await readFile(path.join(root, "docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json"), "utf8")).baselines.length, 0);
});

test("capture runtime is development-only and excludes debug UI without removing layout", async () => {
  const source = await readFile(new URL("../src/qa/VisualCaptureRuntime.js", import.meta.url), "utf8");
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /validateVisualCaptureRequest/);
  assert.match(source, /if \(!request\.ok\) return fail/);
  assert.match(source, /camera-mismatch/);
  assert.match(source, /visibility:hidden/);
  assert.match(main, /import\("\.\/qa\/VisualCaptureRuntime\.js"\)/);
});
