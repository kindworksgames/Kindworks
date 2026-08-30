import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.KW_PRODUCTION_TOWN_AUDIT_PORT || 4183);
const sampleMilliseconds = Number(process.env.KW_TOWN_SAMPLE_MS || 30_000);
const sampleRuns = Number(process.env.KW_TOWN_SAMPLE_RUNS || 3);
const baseUrl = `http://127.0.0.1:${port}`;
const outputFile = path.join(root, "artifacts/visual-readiness-mobile-audit/PRODUCTION_TOWN.json");

async function waitForServer(server) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Preview exited before readiness (${server.exitCode}).`);
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Production preview did not become ready.");
}

async function frameSample(page, milliseconds) {
  return page.evaluate((duration) => new Promise((resolve) => {
    const samples = [];
    let previous = performance.now();
    const started = previous;
    const step = (now) => {
      samples.push(now - previous);
      previous = now;
      if (now - started < duration) requestAnimationFrame(step);
      else {
        const sorted = [...samples].sort((left, right) => left - right);
        resolve({
          count: samples.length,
          average: samples.reduce((total, value) => total + value, 0) / samples.length,
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          maximum: sorted.at(-1),
          over33: samples.filter((value) => value > 33.34).length,
        });
      }
    };
    requestAnimationFrame(step);
  }), milliseconds);
}

async function runProfile(browser, cpuThrottle = 1) {
  const context = await browser.newContext({
    viewport: { width: 667, height: 375 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  const client = await context.newCDPSession(page);
  if (cpuThrottle > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
  const started = performance.now();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(() => document.body.dataset.gameScene === "TownScene", null, { timeout: 60_000 });
  const readyMilliseconds = performance.now() - started;
  await page.waitForTimeout(5_000);
  const frames = await frameSample(page, sampleMilliseconds);
  const snapshot = await page.evaluate(() => {
    const game = window.__KINDWORKS_PHASER_GAME__;
    const testMetrics = window.__KINDWORKS_TEST_METRICS__?.snapshot?.() || null;
    const scene = game?.scene?.getScene?.("TownScene");
    return {
      scene: document.body.dataset.gameScene,
      phaserFps: game?.loop?.actualFps ?? null,
      children: scene?.children?.list?.length ?? testMetrics?.scenes?.find?.(({ key }) => key === "TownScene")?.children ?? null,
      timers: scene?.time?.getAllEvents?.().length ?? testMetrics?.scenes?.find?.(({ key }) => key === "TownScene")?.timers ?? null,
      textures: game?.textures?.list ? Object.keys(game.textures.list).length : testMetrics?.textures ?? null,
      testMetricsAvailable: Boolean(testMetrics),
      canvases: document.querySelectorAll("canvas").length,
      domNodes: document.getElementsByTagName("*").length,
      memory: performance.memory ? {
        usedBytes: performance.memory.usedJSHeapSize,
        totalBytes: performance.memory.totalJSHeapSize,
      } : null,
    };
  });
  await context.close();
  return { cpuThrottle, readyMilliseconds, warmupMilliseconds: 5_000, frames, snapshot, consoleErrors, failedRequests };
}

function aggregateProfiles(runs) {
  const frameCount = runs.reduce((total, run) => total + run.frames.count, 0);
  const frames = {
    count: frameCount,
    average: runs.reduce((total, run) => total + run.frames.average * run.frames.count, 0) / frameCount,
    // Use the worst independent-run percentile rather than masking a slow run.
    p95: Math.max(...runs.map((run) => run.frames.p95)),
    p99: Math.max(...runs.map((run) => run.frames.p99)),
    maximum: Math.max(...runs.map((run) => run.frames.maximum)),
    over33: runs.reduce((total, run) => total + run.frames.over33, 0),
  };
  return {
    cpuThrottle: runs[0]?.cpuThrottle || 1,
    independentRuns: runs.length,
    sampleMilliseconds,
    readyMilliseconds: runs.reduce((total, run) => total + run.readyMilliseconds, 0) / runs.length,
    warmupMilliseconds: runs[0]?.warmupMilliseconds || 0,
    frames,
    runs,
    diagnostics: {
      consoleErrors: runs.flatMap((run) => run.consoleErrors),
      failedRequests: runs.flatMap((run) => run.failedRequests),
    },
  };
}

async function runIndependentProfiles(browser, cpuThrottle) {
  const runs = [];
  for (let run = 0; run < sampleRuns; run += 1) runs.push(await runProfile(browser, cpuThrottle));
  return aggregateProfiles(runs);
}

await mkdir(path.dirname(outputFile), { recursive: true });
const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
try {
  await waitForServer(server);
  const browser = await chromium.launch({ headless: true, args: ["--enable-precise-memory-info"] });
  try {
    const result = {
      generatedAt: new Date().toISOString(),
      environment: "production preview; Playwright Chromium headless; 667x375; DPR 2",
      method: `${sampleRuns} independent run(s), ${sampleMilliseconds} ms each, after a 5000 ms warm-up`,
      normal: await runIndependentProfiles(browser, 1),
      constrained: await runIndependentProfiles(browser, 4),
    };
    result.targets = {
      meanFrameAtOrBelow33_34ms: result.normal.frames.average <= 33.34,
      everyRunP95AtOrBelow33_34ms: result.normal.frames.p95 <= 33.34,
      noRuntimeOrResourceErrors: result.normal.diagnostics.consoleErrors.length === 0
        && result.normal.diagnostics.failedRequests.length === 0
        && result.constrained.diagnostics.consoleErrors.length === 0
        && result.constrained.diagnostics.failedRequests.length === 0,
    };
    await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Production Town performance written to ${outputFile}.`);
  } finally {
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
}
