import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.KW_TOWN_BREAKDOWN_PORT || 4184);
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(server) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before readiness (${server.exitCode}).`);
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Town breakdown server did not become ready.");
}

async function frames(page, duration = 3000) {
  return page.evaluate((milliseconds) => new Promise((resolve) => {
    const samples = [];
    let previous = performance.now(), started = previous;
    const step = (now) => {
      samples.push(now - previous); previous = now;
      if (now - started < milliseconds) requestAnimationFrame(step);
      else {
        const sorted = [...samples].sort((a, b) => a - b);
        resolve({ count: samples.length, average: samples.reduce((sum, value) => sum + value, 0) / samples.length,
          p95: sorted[Math.floor(sorted.length * .95)], over33: samples.filter((value) => value > 33.34).length });
      }
    };
    requestAnimationFrame(step);
  }), duration);
}

async function sample(browser, mode) {
  const context = await browser.newContext({ viewport: { width: 667, height: 375 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  if (mode === "empty-page") {
    await page.setContent("<!doctype html><meta name=viewport content='width=device-width'><body></body>");
    await page.waitForTimeout(500);
    const result = await frames(page);
    await context.close();
    return { mode, counts: { total: 0, byType: {}, graphics: [] }, frames: result };
  }
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.gameScene === "TownScene");
  await page.waitForTimeout(3000);
  const counts = await page.evaluate((selectedMode) => {
    const scene = window.__KINDWORKS_PHASER_GAME__.scene.getScene("TownScene");
    const byType = Object.fromEntries(Object.entries(Object.groupBy(scene.children.list, (child) => child.type)).map(([type, children]) => [type, children.length]));
    const visibleByType = Object.fromEntries(Object.entries(Object.groupBy(scene.children.list.filter((child) => child.visible), (child) => child.type)).map(([type, children]) => [type, children.length]));
    if (selectedMode === "no-update") scene.update = () => {};
    if (selectedMode === "hide-graphics") scene.children.list.filter((child) => child.type === "Graphics").forEach((child) => child.setVisible(false));
    if (selectedMode === "hide-text") scene.children.list.filter((child) => child.type === "Text").forEach((child) => child.setVisible(false));
    if (selectedMode === "hide-containers") scene.children.list.filter((child) => child.type === "Container").forEach((child) => child.setVisible(false));
    if (selectedMode === "hide-all") scene.children.list.forEach((child) => child.setVisible(false));
    if (selectedMode === "stop-loop") window.__KINDWORKS_PHASER_GAME__.loop.stop();
    const graphics = scene.children.list.filter((child) => child.type === "Graphics").map((child, index) => ({
      index, depth: child.depth, commandCount: child.commandBuffer?.length || 0,
      labels: child.getData?.("spriteAiLabelHints") || child.getData?.("spriteAiLabelHint") || null,
    }));
    return {
      total: scene.children.list.length,
      byType,
      visible: scene.children.list.filter((child) => child.visible).length,
      visibleByType,
      graphics: graphics.map(({ index, depth, commandCount }) => ({ index, depth, commandCount })),
    };
  }, mode);
  await page.waitForTimeout(500);
  const result = await frames(page);
  await context.close();
  return { mode, counts, frames: result };
}

const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
try {
  await waitForServer(server);
  const browser = await chromium.launch({ headless: true });
  try {
    const modes = process.argv.slice(2);
    for (const mode of (modes.length ? modes : ["baseline", "no-update", "hide-graphics", "hide-text", "hide-containers", "hide-all"])) console.log(JSON.stringify(await sample(browser, mode)));
  } finally { await browser.close(); }
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2000))]);
}
