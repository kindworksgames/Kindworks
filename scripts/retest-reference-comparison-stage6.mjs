import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { getVisualCaptureCase } from "../src/qa/visualComparisonContracts.js";
import { compareVisualFiles, resolveVisualBaselinePlatform, selectVisualBaseline } from "./lib/visual-comparison.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselineRoot = path.join(root, "docs/qa/visual-readiness/phase-01");
const manifestFile = path.join(baselineRoot, "BASELINE_MANIFEST.json");
const outputRoot = path.join(root, "artifacts/visual-regression/stage-06-independent-retest");
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const baselinePlatform = resolveVisualBaselinePlatform(process.env.KW_VISUAL_BASELINE_PLATFORM || process.platform);
const port = Number(process.env.KW_STAGE6_PORT || 4180);
const baseUrl = `http://127.0.0.1:${port}`;
const exactPolicy = Object.freeze({
  channelDeltaThreshold: 0,
  maxChangedPixelRatio: 0,
  maxMeanAbsoluteError: 0,
});

const TEST_CASES = Object.freeze([
  Object.freeze({ id: "town--narrow-phone", coverage: ["town", "mobile"], displacementSelector: "#game canvas" }),
  Object.freeze({ id: "town--tablet-4x3", coverage: ["town", "tablet"], displacementSelector: "#game canvas" }),
  Object.freeze({ id: "house-interior--tablet-4x3", coverage: ["interior", "tablet"], displacementSelector: "#game canvas" }),
  Object.freeze({ id: "lawn-care--narrow-phone", coverage: ["mini-game", "mobile"], displacementSelector: "#lawn-board" }),
  Object.freeze({ id: "powerwash--tablet-4x3", coverage: ["mini-game", "tablet"], displacementSelector: "#powerwash-board" }),
  Object.freeze({ id: "corner-cafe--modern-phone", coverage: ["UI", "mobile"], displacementSelector: "#cafe-hud" }),
]);

function baselineFor(captureCase) {
  return selectVisualBaseline({ manifest, captureCase, platform: baselinePlatform });
}

async function baselineIntegrityDigest() {
  const hash = createHash("sha256");
  hash.update(await readFile(manifestFile));
  for (const entry of [...manifest.baselines].sort((left, right) => `${left.platform}:${left.captureId}`.localeCompare(`${right.platform}:${right.captureId}`))) {
    hash.update(`${entry.platform}:${entry.captureId}`);
    hash.update(await readFile(path.join(baselineRoot, entry.file)));
  }
  return hash.digest("hex");
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before becoming ready (${server.exitCode}).`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the local KindWorks server.");
}

async function openPreparedPage(browser, captureCase) {
  const context = await browser.newContext({
    viewport: captureCase.viewport,
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));
  const url = `${baseUrl}/?qa=visual-regression&capture=${encodeURIComponent(captureCase.id)}&scenario=${encodeURIComponent(captureCase.scenario)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => ["ready", "failed"].includes(document.body.dataset.visualCaptureStatus), null, { timeout: 15_000 });
  const descriptor = await page.evaluate(() => window.__KINDWORKS_VISUAL_CAPTURE__
    || JSON.parse(document.body.dataset.visualCaptureDetails || "{}"));
  if (!descriptor?.ok) throw new Error(`${captureCase.id} preparation failed: ${descriptor?.code} ${descriptor?.message}`);
  if (descriptor.captureId !== captureCase.id || descriptor.scene !== captureCase.scene
    || descriptor.viewport.width !== captureCase.viewport.width
    || descriptor.viewport.height !== captureCase.viewport.height) {
    throw new Error(`${captureCase.id} returned a mismatched runtime descriptor.`);
  }
  if (runtimeErrors.length) throw new Error(`${captureCase.id} emitted runtime errors:\n${runtimeErrors.join("\n")}`);
  return { context, page, descriptor, runtimeErrors };
}

async function capturePage(page, outputFile) {
  await mkdir(path.dirname(outputFile), { recursive: true });
  await page.screenshot({
    path: outputFile,
    type: "jpeg",
    quality: 80,
    fullPage: false,
    animations: "disabled",
    caret: "hide",
  });
}

async function compare({ baselineFile, candidateFile, differenceFile, policy }) {
  return compareVisualFiles({ baselineFile, candidateFile, differenceFile, policy });
}

async function captureIndependentRepeat(browser, captureCase, outputFile) {
  const prepared = await openPreparedPage(browser, captureCase);
  try {
    await capturePage(prepared.page, outputFile);
    return prepared.descriptor;
  } finally {
    await prepared.context.close();
  }
}

async function runDisplacementCycle(browser, captureCase, selector, directory) {
  const prepared = await openPreparedPage(browser, captureCase);
  const pristineFile = path.join(directory, "cycle-pristine.jpg");
  const displacedFile = path.join(directory, "cycle-displaced.jpg");
  const restoredFile = path.join(directory, "cycle-restored.jpg");
  try {
    await capturePage(prepared.page, pristineFile);
    const displacement = await prepared.page.evaluate(({ targetSelector, pixels }) => {
      const target = document.querySelector(targetSelector);
      if (!target) return { ok: false, message: `Missing displacement target ${targetSelector}.` };
      const previous = {
        value: target.style.getPropertyValue("transform"),
        priority: target.style.getPropertyPriority("transform"),
      };
      target.dataset.kwStage6OriginalTransform = JSON.stringify(previous);
      target.style.setProperty("transform", `translateX(${pixels}px)`, "important");
      return {
        ok: true,
        selector: targetSelector,
        pixels,
        previous,
        applied: getComputedStyle(target).transform,
      };
    }, { targetSelector: selector, pixels: 12 });
    if (!displacement.ok) throw new Error(`${captureCase.id}: ${displacement.message}`);
    await prepared.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await capturePage(prepared.page, displacedFile);
    const restoration = await prepared.page.evaluate((targetSelector) => {
      const target = document.querySelector(targetSelector);
      if (!target) return { ok: false, message: `Missing restoration target ${targetSelector}.` };
      const previous = JSON.parse(target.dataset.kwStage6OriginalTransform || "{}");
      if (previous.value) target.style.setProperty("transform", previous.value, previous.priority || "");
      else target.style.removeProperty("transform");
      delete target.dataset.kwStage6OriginalTransform;
      return { ok: true, restoredInline: target.style.getPropertyValue("transform"), computed: getComputedStyle(target).transform };
    }, selector);
    if (!restoration.ok) throw new Error(`${captureCase.id}: ${restoration.message}`);
    await prepared.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await capturePage(prepared.page, restoredFile);
    return { descriptor: prepared.descriptor, displacement, restoration, pristineFile, displacedFile, restoredFile };
  } finally {
    await prepared.context.close();
  }
}

async function runCase(browser, testCase) {
  const captureCase = getVisualCaptureCase(testCase.id);
  if (!captureCase) throw new Error(`Unknown visual capture case ${testCase.id}.`);
  const baseline = baselineFor(captureCase);
  const baselineFile = path.join(baselineRoot, baseline.file);
  const directory = path.join(outputRoot, captureCase.id);
  await mkdir(directory, { recursive: true });
  const repeatFiles = [];
  const descriptors = [];
  for (let index = 1; index <= 3; index += 1) {
    const outputFile = path.join(directory, `repeat-${index}.jpg`);
    descriptors.push(await captureIndependentRepeat(browser, captureCase, outputFile));
    repeatFiles.push(outputFile);
  }

  const baselineComparisons = [];
  for (let index = 0; index < repeatFiles.length; index += 1) {
    baselineComparisons.push(await compare({
      baselineFile,
      candidateFile: repeatFiles[index],
      differenceFile: path.join(directory, `baseline-vs-repeat-${index + 1}.png`),
      policy: captureCase.policy,
    }));
  }
  const repeatComparisons = [];
  for (let index = 1; index < repeatFiles.length; index += 1) {
    repeatComparisons.push(await compare({
      baselineFile: repeatFiles[0],
      candidateFile: repeatFiles[index],
      differenceFile: path.join(directory, `repeat-1-vs-repeat-${index + 1}.png`),
      policy: exactPolicy,
    }));
  }

  const cycle = await runDisplacementCycle(browser, captureCase, testCase.displacementSelector, directory);
  const cyclePristineBaseline = await compare({
    baselineFile,
    candidateFile: cycle.pristineFile,
    differenceFile: path.join(directory, "baseline-vs-cycle-pristine.png"),
    policy: captureCase.policy,
  });
  const displacedComparison = await compare({
    baselineFile: cycle.pristineFile,
    candidateFile: cycle.displacedFile,
    differenceFile: path.join(directory, "controlled-displacement-difference.png"),
    policy: captureCase.policy,
  });
  const restoredExactComparison = await compare({
    baselineFile: cycle.pristineFile,
    candidateFile: cycle.restoredFile,
    differenceFile: path.join(directory, "restoration-exact-difference.png"),
    policy: exactPolicy,
  });
  const restoredBaselineComparison = await compare({
    baselineFile,
    candidateFile: cycle.restoredFile,
    differenceFile: path.join(directory, "baseline-vs-restored.png"),
    policy: captureCase.policy,
  });

  const baselineMatches = baselineComparisons.every((entry) => entry.ok) && cyclePristineBaseline.ok;
  const deterministic = repeatComparisons.every((entry) => entry.ok);
  const displacementDetected = !displacedComparison.ok && displacedComparison.code === "visual-difference";
  const restoredExactly = restoredExactComparison.ok;
  const restoredToBaseline = restoredBaselineComparison.ok;
  return {
    captureId: captureCase.id,
    scene: captureCase.scene,
    family: captureCase.family,
    profile: captureCase.profile,
    viewport: captureCase.viewport,
    coverage: testCase.coverage,
    displacementSelector: testCase.displacementSelector,
    descriptors,
    files: {
      repeats: repeatFiles.map((file) => path.relative(root, file)),
      cyclePristine: path.relative(root, cycle.pristineFile),
      displaced: path.relative(root, cycle.displacedFile),
      restored: path.relative(root, cycle.restoredFile),
      displacementDifference: path.relative(root, path.join(directory, "controlled-displacement-difference.png")),
    },
    baselineComparisons,
    repeatComparisons,
    cyclePristineBaseline,
    displacedComparison,
    restoredExactComparison,
    restoredBaselineComparison,
    displacement: cycle.displacement,
    restoration: cycle.restoration,
    checks: { baselineMatches, deterministic, displacementDetected, restoredExactly, restoredToBaseline },
    ok: baselineMatches && deterministic && displacementDetected && restoredExactly && restoredToBaseline,
  };
}

const baselineDigestBefore = await baselineIntegrityDigest();
const server = spawn(process.execPath, [
  path.join(root, "node_modules/vite/bin/vite.js"),
  "--host", "127.0.0.1",
  "--port", String(port),
  "--strictPort",
], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverErrors = "";
server.stderr.on("data", (chunk) => { serverErrors += chunk; });

let results = [];
let fatalError = null;
try {
  await waitForServer(server);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const testCase of TEST_CASES) {
      const result = await runCase(browser, testCase);
      results.push(result);
      const displaced = result.displacedComparison.metrics;
      const noise = result.repeatComparisons.reduce((maximum, entry) => Math.max(maximum, entry.metrics?.changedPixelRatio || 0), 0);
      console.log(`${result.ok ? "PASS" : "FAIL"} ${result.captureId}: repeat noise ${(noise * 100).toFixed(6)}%; displaced ${(displaced.changedPixelRatio * 100).toFixed(4)}%; restored exact=${result.checks.restoredExactly}.`);
    }
  } finally {
    await browser.close();
  }
} catch (error) {
  fatalError = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
}

const baselineDigestAfter = await baselineIntegrityDigest();
const baselineIntegrityPreserved = baselineDigestBefore === baselineDigestAfter;
const requiredCoverage = ["town", "interior", "mini-game", "UI", "mobile", "tablet"];
const covered = new Set(results.flatMap((entry) => entry.coverage));
const coverageComplete = requiredCoverage.every((item) => covered.has(item));
const passed = !fatalError && baselineIntegrityPreserved && coverageComplete && results.length === TEST_CASES.length && results.every((entry) => entry.ok);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: "Playwright Chromium headless emulation",
    physicalDeviceTesting: false,
    port,
    independentBrowserContextsPerRepeat: true,
    repeatsPerCase: 3,
    controlledDisplacementCssPixels: 12,
    baselinePlatform,
  },
  policy: {
    approvedPolicyUnchanged: true,
    exactRepeatPolicy: exactPolicy,
  },
  requiredCoverage,
  covered: [...covered].sort(),
  coverageComplete,
  immutableBaselines: {
    before: baselineDigestBefore,
    after: baselineDigestAfter,
    preserved: baselineIntegrityPreserved,
  },
  fatalError,
  serverErrors: serverErrors && !/Browserslist/.test(serverErrors) ? serverErrors : "",
  passed,
  verdict: passed ? "STAGE 6 PASS" : "STAGE 6 FAIL",
  results,
};
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "RESULT.json"), `${JSON.stringify(report, null, 2)}\n`);
if (fatalError) console.error(fatalError.stack || fatalError.message);
console.log(`${report.verdict}: ${results.filter((entry) => entry.ok).length}/${TEST_CASES.length} cases passed; baseline integrity ${baselineIntegrityPreserved ? "preserved" : "FAILED"}.`);
if (!passed) process.exitCode = 1;
