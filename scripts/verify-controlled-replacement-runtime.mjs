import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.KW_CONTROLLED_REPLACEMENT_PORT || 4185);
const baseUrl = `http://127.0.0.1:${port}`;
const semanticId = process.env.KW_CONTROLLED_REPLACEMENT_ASSET || "prop.town.slice.rubbish-can";
const outputDirectory = path.join(root, "artifacts/controlled-artwork-replacement");

async function waitForServer(server) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before readiness (${server.exitCode}).`);
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Controlled-replacement server did not become ready.");
}

const durableState = () => {
  const state = window.__KINDWORKS_PHASER_GAME__?.registry?.get?.("gameState")?.getSnapshot?.();
  if (!state) return null;
  return {
    schemaVersion: state.schemaVersion,
    economy: state.economy,
    inventory: state.inventory,
    minigames: state.minigames,
    animals: state.animals,
    npcTownLife: state.npcTownLife,
    progression: state.progression,
  };
};

async function inspect(page, profile) {
  const errors = [], failedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }));
  const url = `${baseUrl}/?qa=candidate-preview&asset=${encodeURIComponent(semanticId)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.candidatePreviewReady === "true", null, { timeout: 60_000 });
  const beforeReload = await page.evaluate(durableState);
  const first = await page.evaluate(() => ({
    scene: document.body.dataset.candidatePreviewScene,
    semanticId: document.body.dataset.candidatePreviewAsset,
    geometry: document.body.dataset.candidatePreviewGeometry,
    placement: JSON.parse(document.body.dataset.candidatePreviewPlacement),
    input: document.body.dataset.candidatePreviewInput,
    overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
  }));
  await page.screenshot({ path: path.join(outputDirectory, `${profile.id}.png`) });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.candidatePreviewReady === "true", null, { timeout: 60_000 });
  const second = await page.evaluate(() => ({
    geometry: document.body.dataset.candidatePreviewGeometry,
    placement: JSON.parse(document.body.dataset.candidatePreviewPlacement),
  }));
  second.durableState = await page.evaluate(durableState);
  if (first.semanticId !== semanticId || first.input !== "disabled" || first.overflow) throw new Error(`${profile.id} candidate preview violated its presentation-only contract.`);
  if (first.geometry !== second.geometry || JSON.stringify(first.placement) !== JSON.stringify(second.placement)) throw new Error(`${profile.id} placement or geometry changed after reload.`);
  if (JSON.stringify(beforeReload) !== JSON.stringify(second.durableState)) throw new Error(`${profile.id} durable gameplay state changed during candidate reload.`);
  if (errors.length || failedRequests.length) throw new Error(`${profile.id} runtime errors: ${JSON.stringify({ errors, failedRequests })}`);
  return { profile, first, reload: second, durableStateUnchanged: true, errors, failedRequests };
}

await mkdir(outputDirectory, { recursive: true });
const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
try {
  await waitForServer(server);
  const browser = await chromium.launch({ headless: true });
  try {
    const profiles = [
      { id: "desktop", width: 1366, height: 768, mobile: false },
      { id: "phone", width: 568, height: 320, mobile: true },
      { id: "tablet", width: 1024, height: 768, mobile: true },
    ];
    const results = [];
    for (const profile of profiles) {
      const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: profile.mobile ? 2 : 1, isMobile: profile.mobile, hasTouch: profile.mobile });
      const page = await context.newPage();
      results.push(await inspect(page, profile));
      await context.close();
    }
    const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), semanticId, humanApprovalPerformed: false, result: "PASS", profiles: results };
    await writeFile(path.join(outputDirectory, "RESULT.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Controlled artwork replacement: PASS — ${semanticId}; desktop, phone and tablet; reload state unchanged.`);
  } finally { await browser.close(); }
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
}
