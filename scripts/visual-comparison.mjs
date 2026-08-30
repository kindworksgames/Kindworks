import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  VISUAL_CAPTURE_CASES,
  getVisualCaptureCase,
  validateVisualComparisonContracts,
} from "../src/qa/visualComparisonContracts.js";
import {
  approvalToken,
  approveVisualCandidate,
  compareVisualFiles,
  sha256File,
} from "./lib/visual-comparison.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselineRoot = path.join(root, "docs/qa/visual-readiness/phase-01");
const outputRoot = path.join(root, "artifacts/visual-regression");
const manifestFile = path.join(baselineRoot, "BASELINE_MANIFEST.json");
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const args = process.argv.slice(2);
const command = args[0] || "compare";
const value = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const requestedCase = value("--case");
const selectedCases = requestedCase ? [getVisualCaptureCase(requestedCase)].filter(Boolean) : VISUAL_CAPTURE_CASES;

const contractValidation = validateVisualComparisonContracts();
if (!contractValidation.ok) throw new Error(contractValidation.errors.join("\n"));
if (requestedCase && selectedCases.length === 0) throw new Error(`Unknown capture case: ${requestedCase}.`);

function baselineFor(captureCase) {
  const baseline = manifest.baselines.find((entry) => entry.scenario === captureCase.scenario && entry.profile === captureCase.profile);
  if (!baseline) throw new Error(`No approved baseline is associated with ${captureCase.id}.`);
  if (baseline.scene !== captureCase.scene || baseline.width !== captureCase.viewport.width || baseline.height !== captureCase.viewport.height) {
    throw new Error(`${captureCase.id} does not match its approved baseline scene or viewport.`);
  }
  return baseline;
}

async function waitForServer(url, processHandle) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (processHandle.exitCode !== null) throw new Error(`Vite exited before becoming ready (${processHandle.exitCode}).`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the local KindWorks server.");
}

async function captureCandidates() {
  const port = Number(value("--port") || 4178);
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverErrors = "";
  server.stderr.on("data", (chunk) => { serverErrors += chunk; });
  try {
    await waitForServer(baseUrl, server);
    const browser = await chromium.launch({ headless: true });
    const results = [];
    try {
      for (const captureCase of selectedCases) {
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
        const descriptor = await page.evaluate(() => window.__KINDWORKS_VISUAL_CAPTURE__ || JSON.parse(document.body.dataset.visualCaptureDetails || "{}"));
        if (!descriptor?.ok) throw new Error(`${captureCase.id} preparation failed: ${descriptor?.code} ${descriptor?.message}`);
        if (descriptor.captureId !== captureCase.id || descriptor.scene !== captureCase.scene
          || descriptor.viewport.width !== captureCase.viewport.width || descriptor.viewport.height !== captureCase.viewport.height) {
          throw new Error(`${captureCase.id} returned a mismatched runtime descriptor.`);
        }
        if (runtimeErrors.length) throw new Error(`${captureCase.id} emitted runtime errors:\n${runtimeErrors.join("\n")}`);
        const candidateFile = path.join(outputRoot, "current", `${captureCase.id}.jpg`);
        await mkdir(path.dirname(candidateFile), { recursive: true });
        await page.screenshot({ path: candidateFile, type: "jpeg", quality: 80, fullPage: false, animations: "disabled", caret: "hide" });
        const baseline = baselineFor(captureCase);
        const differenceFile = path.join(outputRoot, "differences", `${captureCase.id}.png`);
        const comparison = await compareVisualFiles({
          baselineFile: path.join(baselineRoot, baseline.file),
          candidateFile,
          differenceFile,
          policy: captureCase.policy,
        });
        const result = { captureId: captureCase.id, descriptor, candidateFile: path.relative(root, candidateFile), differenceFile: path.relative(root, differenceFile), comparison };
        results.push(result);
        await writeFile(path.join(outputRoot, "current", `${captureCase.id}.json`), `${JSON.stringify(result, null, 2)}\n`);
        await context.close();
      }
    } finally {
      await browser.close();
    }
    await mkdir(outputRoot, { recursive: true });
    const summary = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      command: "compare",
      immutableBaselines: true,
      passed: results.filter((entry) => entry.comparison.ok).length,
      failed: results.filter((entry) => !entry.comparison.ok).length,
      results,
    };
    await writeFile(path.join(outputRoot, "SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);
    return summary;
  } finally {
    server.kill("SIGTERM");
    if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
    if (serverErrors && !/Browserslist/.test(serverErrors)) process.stderr.write(serverErrors);
  }
}

if (command === "capture" || command === "compare") {
  const summary = await captureCandidates();
  for (const result of summary.results) {
    console.log(`${result.comparison.ok ? "PASS" : "FAIL"} ${result.captureId}: ${result.comparison.message}`);
  }
  console.log(`Visual comparison complete: ${summary.passed} passed, ${summary.failed} failed. Baselines were not modified.`);
  if (command === "compare" && summary.failed) process.exitCode = 1;
} else if (command === "approve") {
  if (!requestedCase) throw new Error("Approval requires exactly one --case.");
  const captureCase = selectedCases[0];
  const candidateFile = path.join(outputRoot, "current", `${captureCase.id}.jpg`);
  const hash = await sha256File(candidateFile);
  const token = value("--token");
  if (!token) throw new Error(`Approval is fail-closed. Review ${path.relative(root, candidateFile)}, then rerun with --reviewer NAME --token ${approvalToken(hash)}.`);
  const result = await approveVisualCandidate({
    root,
    manifest,
    baseline: baselineFor(captureCase),
    candidateFile,
    reviewer: value("--reviewer"),
    token,
  });
  console.log(`Approved ${captureCase.id} by ${result.approval.reviewer}; ${result.candidateSha256}.`);
} else {
  throw new Error(`Unknown visual comparison command: ${command}. Use capture, compare, or approve.`);
}
