import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts/visual-regression/reference-overlay");
const port = 4179;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Reference-comparison server did not become ready.");
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(`${url}/?qa=reference-overlay`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("body[data-reference-overlay-ready='true']", { timeout: 15_000 });
    await mkdir(output, { recursive: true });
    await page.locator("[data-overlay-mode='side-by-side']").click();
    await page.waitForSelector("#kw-reference-comparison-surface[data-mode='side-by-side']");
    const sideBySidePanels = await page.locator("#kw-reference-comparison-surface figure").count();
    if (sideBySidePanels !== 2) throw new Error(`Side-by-side mode rendered ${sideBySidePanels} panels instead of 2.`);
    await page.screenshot({ path: path.join(output, "fishing-side-by-side.png") });

    await page.locator("[data-overlay-mode='difference']").click();
    await page.waitForSelector("#kw-reference-comparison-surface[data-mode='difference'] canvas");
    const metrics = await page.evaluate(() => JSON.parse(document.body.dataset.referenceDifferenceMetrics || "null"));
    if (!metrics || !Number.isFinite(metrics.changedPixelRatio) || !Number.isFinite(metrics.meanAbsoluteError)) throw new Error("Difference mode did not publish measured metrics.");
    await page.screenshot({ path: path.join(output, "fishing-difference.png") });

    const rejection = await page.evaluate(async () => {
      const scene = window.__KINDWORKS_PHASER_GAME__?.scene?.getScene?.("FishingScene");
      return scene?.referenceOverlay?.loadReferenceDataUrl?.("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X+X7WQAAAABJRU5ErkJggg==", "Village Grocer.png");
    });
    if (rejection?.ok !== false || !/not associated|16:9/.test(rejection?.message || "")) throw new Error("An unrelated or misaligned reference was not rejected correctly.");
    if (errors.length) throw new Error(`Reference comparison emitted runtime errors: ${errors.join(" | ")}`);
    const evidence = { schemaVersion: 1, scene: "FishingScene", referenceId: "reference.fishing.reedbank", sideBySidePanels, metrics, unrelatedReferenceRejected: true };
    await writeFile(path.join(output, "RESULT.json"), `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Reference comparison: PASS — side-by-side=${sideBySidePanels} panels; changed=${(metrics.changedPixelRatio * 100).toFixed(2)}%; MAE=${metrics.meanAbsoluteError.toFixed(2)}; wrong reference rejected.`);
  } finally {
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
}
