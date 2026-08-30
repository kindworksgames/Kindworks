import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "artifacts/visual-readiness-mobile-audit");
const port = Number(process.env.KW_MOBILE_AUDIT_PORT || 4182);
const baseUrl = `http://127.0.0.1:${port}`;

const PROFILES = Object.freeze([
  { id: "small-landscape-phone", width: 568, height: 320, family: "phone", mobile: true },
  { id: "standard-landscape-phone", width: 667, height: 375, family: "phone", mobile: true },
  { id: "wide-notched-landscape-phone", width: 844, height: 390, family: "phone", mobile: true, notchClass: true },
  { id: "small-tablet", width: 960, height: 600, family: "tablet", mobile: true },
  { id: "standard-tablet", width: 1024, height: 768, family: "tablet", mobile: true },
  { id: "large-tablet", width: 1180, height: 820, family: "tablet", mobile: true },
  { id: "desktop-development", width: 1366, height: 768, family: "desktop", mobile: false },
]);

const ACTIVITIES = Object.freeze([
  { id: "house-interior", scene: "HouseInteriorScene", playfield: "#game canvas" },
  { id: "lawn", scene: "LawnCareScene", playfield: "#lawn-board" },
  { id: "cafe", scene: "CafeScene", playfield: "#cafe-hud" },
  { id: "powerwash", scene: "PlaygroundPowerwashScene", playfield: "#powerwash-board" },
]);

const visible = `(element) => {
  if (!element || element.hidden || element.classList.contains("hidden")) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
}`;

async function waitForServer(server) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before readiness (${server.exitCode}).`);
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Mobile audit server did not become ready.");
}

function newContext(browser, profile, extras = {}) {
  return browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: extras.deviceScaleFactor || (profile.mobile ? 2 : 1),
    isMobile: profile.mobile,
    hasTouch: profile.mobile,
    locale: "en-GB",
    timezoneId: "Europe/London",
    colorScheme: "light",
    reducedMotion: "reduce",
  });
}

function observeErrors(page) {
  const errors = [];
  const warnings = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || "failed" }));
  return { errors, warnings, failedRequests };
}

async function waitForGame(page) {
  await page.waitForFunction(() => window.__KINDWORKS_PHASER_GAME__?.scene?.getScenes?.(true)?.length > 0, null, { timeout: 20_000 });
  await page.waitForFunction(() => document.body.dataset.gameScene && document.body.dataset.gameScene !== "BootScene", null, { timeout: 20_000 });
}

async function openActivity(page, activityId, scene) {
  const startedAt = await page.evaluate(() => performance.now());
  const result = await page.evaluate(({ id }) => window.__KINDWORKS_PHASER__?.qaOpenFidelityActivity?.(id, 1), { id: activityId });
  if (!result?.ok) throw new Error(`${activityId} could not open: ${result?.message || result?.code}`);
  await page.waitForFunction((expected) => document.body.dataset.gameScene === expected, scene, { timeout: 20_000 });
  await page.waitForTimeout(420);
  return (await page.evaluate(() => performance.now())) - startedAt;
}

async function snapshot(page, { label, playfield = null, coarse = false } = {}) {
  return page.evaluate(({ auditLabel, playfieldSelector, isCoarse, visibleSource }) => {
    const isVisible = Function(`return ${visibleSource}`)();
    const viewport = { width: innerWidth, height: innerHeight };
    const game = window.__KINDWORKS_PHASER_GAME__;
    const scenes = game?.scene?.getScenes?.(true) || [];
    const bodyScene = document.body.dataset.gameScene;
    const scene = scenes.find((entry) => entry.scene.key === bodyScene) || scenes.at(-1) || scenes[0];
    const rectOf = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
    };
    const contained = (rect) => !rect || (rect.x >= -1 && rect.y >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1);
    const controls = [...document.querySelectorAll("button,[role=button],input,select,textarea")]
      .filter((element) => isVisible(element) && !element.disabled && !element.closest("#fidelity-qa-panel"))
      .map((element) => {
        const rect = rectOf(element), style = getComputedStyle(element);
        return {
          id: element.id || null,
          label: (element.getAttribute("aria-label") || element.textContent || element.value || "").replace(/\s+/g, " ").trim().slice(0, 100),
          bounds: rect,
          contained: contained(rect),
          touchAction: style.touchAction,
          fontSize: Number.parseFloat(style.fontSize) || 0,
          below44: rect.width < 43.5 || rect.height < 43.5,
        };
      });
    const text = [...document.querySelectorAll("body *")]
      .filter((element) => element.children.length === 0 && String(element.textContent || "").trim() && isVisible(element) && !element.closest("#fidelity-qa-panel"))
      .map((element) => ({
        id: element.id || null,
        text: String(element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize) || 0,
      }));
    const canvases = [...document.querySelectorAll("canvas")].filter(isVisible).map((canvas) => {
      const rect = rectOf(canvas), style = getComputedStyle(canvas);
      const scaleX = rect.width / Math.max(1, canvas.width), scaleY = rect.height / Math.max(1, canvas.height);
      return {
        id: canvas.id || null,
        internal: { width: canvas.width, height: canvas.height },
        bounds: rect,
        contained: contained(rect),
        imageRendering: style.imageRendering,
        cssScale: { x: scaleX, y: scaleY, integerX: Number.isInteger(scaleX), integerY: Number.isInteger(scaleY) },
        centerMapping: {
          x: ((rect.x + rect.width / 2 - rect.x) / Math.max(1, rect.width)) * canvas.width,
          y: ((rect.y + rect.height / 2 - rect.y) / Math.max(1, rect.height)) * canvas.height,
        },
      };
    });
    const playfieldElement = playfieldSelector ? document.querySelector(playfieldSelector) : document.querySelector("#game canvas");
    const playfieldBounds = playfieldElement && isVisible(playfieldElement) ? rectOf(playfieldElement) : null;
    const camera = scene?.cameras?.main;
    const gl = game?.renderer?.gl;
    const safeProbe = document.createElement("div");
    safeProbe.style.cssText = "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
    document.body.append(safeProbe);
    const safeStyle = getComputedStyle(safeProbe);
    const safeInsets = { top: safeStyle.paddingTop, right: safeStyle.paddingRight, bottom: safeStyle.paddingBottom, left: safeStyle.paddingLeft };
    safeProbe.remove();
    return {
      label: auditLabel,
      scene: bodyScene,
      viewport,
      visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale, offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop } : null,
      devicePixelRatio,
      orientation: document.body.dataset.orientationExpected,
      orientationBlocked: document.body.dataset.orientationBlocked,
      document: {
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        bodyOverflow: getComputedStyle(document.body).overflow,
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      },
      phaser: {
        renderType: game?.renderer?.type || null,
        configuredWidth: Number(game?.config?.width) || null,
        configuredHeight: Number(game?.config?.height) || null,
        pixelArt: game?.config?.pixelArt,
        roundPixels: game?.config?.roundPixels,
        scaleMode: game?.scale?.scaleMode,
        autoCenter: game?.scale?.autoCenter,
        displaySize: game?.scale?.displaySize ? { width: game.scale.displaySize.width, height: game.scale.displaySize.height } : null,
        parentSize: game?.scale?.parentSize ? { width: game.scale.parentSize.width, height: game.scale.parentSize.height } : null,
        maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null,
      },
      camera: camera ? {
        width: camera.width, height: camera.height, zoom: camera.zoom, roundPixels: camera.roundPixels,
        scrollX: camera.scrollX, scrollY: camera.scrollY,
        bounds: camera.getBounds ? { x: camera.getBounds().x, y: camera.getBounds().y, width: camera.getBounds().width, height: camera.getBounds().height } : null,
      } : null,
      safeInsets,
      canvases,
      playfield: { selector: playfieldSelector, bounds: playfieldBounds, contained: contained(playfieldBounds) },
      controls: {
        count: controls.length,
        below44: isCoarse ? controls.filter((entry) => entry.below44) : [],
        outsideViewport: controls.filter((entry) => !entry.contained),
        samples: controls.slice(0, 80),
      },
      text: {
        count: text.length,
        below10: text.filter((entry) => entry.fontSize > 0 && entry.fontSize < 10).slice(0, 80),
        below12: text.filter((entry) => entry.fontSize > 0 && entry.fontSize < 12).slice(0, 80),
      },
      sceneLayout: scene?.sceneLayouts?.layout ? {
        id: scene.sceneLayouts.layout.id,
        canonicalSize: scene.sceneLayouts.layout.canonicalSize,
        schemaVersion: scene.sceneLayouts.layout.schemaVersion,
      } : null,
      activeScenes: scenes.map((entry) => ({ key: entry.scene.key, children: entry.children?.list?.length || 0, timers: entry.time?.getAllEvents?.().length || 0 })),
    };
  }, { auditLabel: label, playfieldSelector: playfield, isCoarse: coarse, visibleSource: visible });
}

async function openTownMenu(page) {
  const button = page.locator("#town-menu-button");
  if (await button.count()) await button.click();
  await page.waitForTimeout(100);
  return page.evaluate((visibleSource) => {
    const isVisible = Function(`return ${visibleSource}`)();
    const panel = document.querySelector("#town-menu-panel");
    const rect = panel?.getBoundingClientRect?.();
    return { visible: isVisible(panel), bounds: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom } : null };
  }, visible);
}

async function runProfile(browser, profile) {
  const context = await newContext(browser, profile);
  const page = await context.newPage();
  const logs = observeErrors(page);
  try {
    const startedAt = performance.now();
    await page.goto(`${baseUrl}/?qa=fidelity&mobile-visual-audit=${profile.id}`, { waitUntil: "domcontentloaded" });
    await waitForGame(page);
    await page.waitForTimeout(500);
    const startupMilliseconds = performance.now() - startedAt;
    const scenes = [];
    scenes.push(await snapshot(page, { label: "town", coarse: profile.mobile }));
    const townMenu = await openTownMenu(page);
    await page.screenshot({ path: path.join(outputRoot, "screenshots", `${profile.id}--town.png`), animations: "disabled" });
    await page.keyboard.press("Escape");
    for (const activity of ACTIVITIES) {
      const transitionMilliseconds = await openActivity(page, activity.id, activity.scene);
      const state = await snapshot(page, { label: activity.id, playfield: activity.playfield, coarse: profile.mobile });
      state.transitionMilliseconds = transitionMilliseconds;
      scenes.push(state);
    }
    await page.screenshot({ path: path.join(outputRoot, "screenshots", `${profile.id}--powerwash.png`), animations: "disabled" });
    return { profile, startupMilliseconds, townMenu, scenes, logs };
  } finally {
    await context.close();
  }
}

async function auditReferenceOverlay(browser, profile) {
  const context = await newContext(browser, profile);
  const page = await context.newPage();
  const logs = observeErrors(page);
  try {
    await page.goto(`${baseUrl}/?qa=reference-overlay`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("body[data-reference-overlay-ready='true']", { timeout: 20_000 });
    await page.locator("[data-overlay-mode='side-by-side']").click();
    await page.waitForSelector("#kw-reference-comparison-surface[data-mode='side-by-side']");
    const result = await page.evaluate(() => {
      const surface = document.querySelector("#kw-reference-comparison-surface");
      const rect = surface?.getBoundingClientRect?.();
      const images = [...document.querySelectorAll("#kw-reference-comparison-surface img")].map((image) => ({ naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, bounds: image.getBoundingClientRect().toJSON() }));
      return {
        viewport: { width: innerWidth, height: innerHeight },
        surface: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom } : null,
        panels: document.querySelectorAll("#kw-reference-comparison-surface figure").length,
        images,
        overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
      };
    });
    await page.screenshot({ path: path.join(outputRoot, "screenshots", `${profile.id}--reference-overlay.png`), animations: "disabled" });
    return { profile: profile.id, ...result, logs };
  } finally { await context.close(); }
}

async function auditAssetLab(browser, profile) {
  const context = await newContext(browser, profile);
  const page = await context.newPage();
  const logs = observeErrors(page);
  try {
    await page.goto(`${baseUrl}/?qa=asset-lab`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("body[data-asset-lab-ready='true']", { timeout: 20_000 });
    const result = await page.evaluate((visibleSource) => {
      const isVisible = Function(`return ${visibleSource}`)();
      const panel = document.querySelector("#kw-asset-lab"), toggle = document.querySelector("#kw-asset-lab-toggle");
      const rect = (element) => element ? element.getBoundingClientRect().toJSON() : null;
      const viewportSelect = [...document.querySelectorAll("#kw-asset-lab select")].find((element) => element.getAttribute("aria-label") === "Viewport frame");
      const controls = [...document.querySelectorAll("#kw-asset-lab button,#kw-asset-lab input,#kw-asset-lab select")].filter(isVisible).map((element) => ({ label: element.getAttribute("aria-label") || element.textContent, bounds: rect(element) }));
      return {
        panel: rect(panel), toggle: rect(toggle), collapsed: panel?.dataset.collapsed,
        viewportOptions: viewportSelect ? [...viewportSelect.options].map((option) => option.value) : [],
        controlsBelow44: controls.filter(({ bounds }) => bounds.width < 43.5 || bounds.height < 43.5),
        overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
        status: document.body.dataset.assetLabValidationSummary,
      };
    }, visible);
    await page.screenshot({ path: path.join(outputRoot, "screenshots", `${profile.id}--asset-lab.png`), animations: "disabled" });
    return { profile: profile.id, ...result, logs };
  } finally { await context.close(); }
}

async function auditOrientation(browser) {
  const cases = [
    { id: "lawn-in-portrait", profile: { width: 390, height: 844, mobile: true }, activity: "lawn", scene: "LawnCareScene", blocked: "true" },
    { id: "river-in-landscape", profile: { width: 844, height: 390, mobile: true }, activity: "river", scene: "RiverClearoutScene", blocked: "true" },
    { id: "river-in-portrait", profile: { width: 390, height: 844, mobile: true }, activity: "river", scene: "RiverClearoutScene", blocked: "false" },
  ];
  const results = [];
  for (const entry of cases) {
    const context = await newContext(browser, entry.profile);
    const page = await context.newPage();
    const logs = observeErrors(page);
    try {
      await page.goto(`${baseUrl}/?qa=fidelity`, { waitUntil: "domcontentloaded" });
      await waitForGame(page);
      await openActivity(page, entry.activity, entry.scene);
      const result = await page.evaluate(() => ({
        scene: document.body.dataset.gameScene,
        blocked: document.body.dataset.orientationBlocked,
        expected: document.body.dataset.orientationExpected,
        mode: document.body.dataset.orientationMode,
        message: document.querySelector("#landscape-required-message")?.textContent,
        loopSleeping: Boolean(window.__KINDWORKS_PHASER_GAME__?.loop?.sleeping),
      }));
      results.push({ ...entry, result, pass: result.blocked === entry.blocked, logs });
    } finally { await context.close(); }
  }
  return results;
}

async function frameSample(page, milliseconds = 3000) {
  return page.evaluate((duration) => new Promise((resolve) => {
    const samples = [];
    let previous = performance.now(), started = previous;
    const step = (now) => {
      samples.push(now - previous); previous = now;
      if (now - started < duration) requestAnimationFrame(step);
      else {
        const sorted = [...samples].sort((a, b) => a - b);
        resolve({ count: samples.length, average: samples.reduce((sum, value) => sum + value, 0) / samples.length, p95: sorted[Math.floor(sorted.length * 0.95)], p99: sorted[Math.floor(sorted.length * 0.99)], maximum: sorted.at(-1), over33: samples.filter((value) => value > 33.34).length });
      }
    };
    requestAnimationFrame(step);
  }), milliseconds);
}

async function performanceSnapshot(page) {
  return page.evaluate(() => {
    const game = window.__KINDWORKS_PHASER_GAME__, scenes = game?.scene?.getScenes?.(true) || [];
    const sourceObjects = new Set();
    let decodedTextureBytes = 0, largestTexture = null, atlasTextures = 0, textureFrames = 0;
    for (const [key, texture] of Object.entries(game?.textures?.list || {})) {
      const frames = texture?.getFrameNames?.() || [];
      textureFrames += frames.length;
      if (frames.length > 1) atlasTextures += 1;
      for (const source of texture?.source || []) {
        const object = source?.source || source;
        if (!object || sourceObjects.has(object)) continue;
        sourceObjects.add(object);
        const width = Number(source.width || object.width || object.naturalWidth || 0), height = Number(source.height || object.height || object.naturalHeight || 0);
        const bytes = width * height * 4; decodedTextureBytes += bytes;
        if (!largestTexture || bytes > largestTexture.bytes) largestTexture = { key, width, height, bytes };
      }
    }
    const resources = performance.getEntriesByType("resource");
    const resourceCounts = resources.reduce((map, entry) => map.set(entry.name, (map.get(entry.name) || 0) + 1), new Map());
    const registry = game?.registry?.get?.("visualRegistry");
    return {
      scene: document.body.dataset.gameScene,
      phaserFps: game?.loop?.actualFps,
      activeScenes: scenes.map((scene) => ({ key: scene.scene.key, children: scene.children?.list?.length || 0, timers: scene.time?.getAllEvents?.().length || 0, particles: scene.children?.list?.filter((child) => /Particle/i.test(child?.type || child?.constructor?.name || "")).length || 0 })),
      textures: { count: Object.keys(game?.textures?.list || {}).length, uniqueSources: sourceObjects.size, decodedBytesApproximate: decodedTextureBytes, largestTexture, atlasTextures, frameCount: textureFrames, animations: game?.anims?.anims?.entries?.size || game?.anims?.anims?.size || 0 },
      nativeCanvasAssets: registry?.nativeImages ? { count: registry.nativeImages.size, assets: [...registry.nativeImages.entries()].map(([id, entry]) => ({ id, width: entry.image?.naturalWidth || entry.image?.width, height: entry.image?.naturalHeight || entry.image?.height })) } : null,
      registryFailures: registry?.getFailures?.() || [],
      resources: { count: resources.length, duplicates: [...resourceCounts].filter(([, count]) => count > 1).map(([url, count]) => ({ url, count })), transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0), lastResponseMilliseconds: resources.reduce((max, entry) => Math.max(max, entry.responseEnd || 0), 0) },
      domNodes: document.getElementsByTagName("*").length,
      canvases: document.querySelectorAll("canvas").length,
      memory: performance.memory ? { usedBytes: performance.memory.usedJSHeapSize, totalBytes: performance.memory.totalJSHeapSize, limitBytes: performance.memory.jsHeapSizeLimit } : null,
    };
  });
}

async function auditPerformance(browser) {
  const profile = PROFILES[1];
  const context = await newContext(browser, profile);
  const page = await context.newPage();
  const logs = observeErrors(page);
  const transitions = [];
  try {
    const navigationStarted = performance.now();
    await page.goto(`${baseUrl}/?qa=fidelity&performance-audit=true`, { waitUntil: "domcontentloaded" });
    await waitForGame(page); await page.waitForTimeout(500);
    const startupMilliseconds = performance.now() - navigationStarted;
    await page.waitForTimeout(3000);
    const before = await performanceSnapshot(page);
    const townFrames = await frameSample(page, 4000);
    const sequence = [
      ["lawn", "LawnCareScene"], ["waste", "WasteCollectionScene"], ["beach", "BeachCleanupScene"],
      ["cafe", "CafeScene"], ["house-interior", "HouseInteriorScene"], ["powerwash", "PlaygroundPowerwashScene"], ["fishing", "FishingScene"],
    ];
    for (let cycle = 0; cycle < 3; cycle += 1) for (const [id, scene] of sequence) transitions.push({ cycle: cycle + 1, id, scene, milliseconds: await openActivity(page, id, scene) });
    if (typeof page.requestGC === "function") await page.requestGC();
    await page.waitForTimeout(500);
    const afterTransitions = await performanceSnapshot(page);
    const postTransitionFrames = await frameSample(page, 3000);
    const soakStart = await performanceSnapshot(page);
    await page.waitForTimeout(15_000);
    if (typeof page.requestGC === "function") await page.requestGC();
    const soakEnd = await performanceSnapshot(page);
    return { profile: profile.id, startupMilliseconds, before, townFrames, transitions, afterTransitions, postTransitionFrames, soak: { milliseconds: 15_000, start: soakStart, end: soakEnd }, logs };
  } finally { await context.close(); }
}

async function auditThrottled(browser) {
  const profile = PROFILES[1], context = await newContext(browser, profile);
  const page = await context.newPage(), logs = observeErrors(page), client = await context.newCDPSession(page);
  try {
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const startedAt = performance.now();
    await page.goto(`${baseUrl}/?qa=fidelity&performance-audit=throttled`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await waitForGame(page); await page.waitForTimeout(3000);
    const startupMilliseconds = performance.now() - startedAt;
    const townFrames = await frameSample(page, 4000);
    const transitionMilliseconds = await openActivity(page, "powerwash", "PlaygroundPowerwashScene");
    await page.waitForTimeout(2000);
    const powerwashFrames = await frameSample(page, 4000);
    return { profile: profile.id, constraints: { cpuThrottle: 4, networkThrottle: false, reason: "Vite development serves many unbundled modules; network throttling it does not represent the production payload." }, startupMilliseconds, transitionMilliseconds, townFrames, powerwashFrames, snapshot: await performanceSnapshot(page), logs };
  } finally { await context.close(); }
}

async function auditContextRecovery(browser) {
  const profile = PROFILES[1], context = await newContext(browser, profile), page = await context.newPage(), logs = observeErrors(page);
  try {
    await page.goto(`${baseUrl}/?qa=fidelity&context-recovery=true`, { waitUntil: "domcontentloaded" });
    await waitForGame(page); await page.waitForTimeout(400);
    const before = await performanceSnapshot(page);
    const support = await page.evaluate(() => {
      const gl = window.__KINDWORKS_PHASER_GAME__?.renderer?.gl;
      const extension = gl?.getExtension?.("WEBGL_lose_context");
      if (!gl || !extension) return { supported: false };
      extension.loseContext();
      window.__KW_CONTEXT_RESTORE__ = () => extension.restoreContext();
      return { supported: true, lostImmediately: gl.isContextLost() };
    });
    if (!support.supported) return { support, before, logs };
    await page.waitForTimeout(500);
    const lost = await page.evaluate(() => ({ scene: document.body.dataset.gameScene, contextLost: window.__KINDWORKS_PHASER_GAME__?.renderer?.gl?.isContextLost?.(), loopRunning: window.__KINDWORKS_PHASER_GAME__?.loop?.running }));
    await page.evaluate(() => window.__KW_CONTEXT_RESTORE__?.());
    await page.waitForTimeout(1500);
    const recovered = await page.evaluate(() => ({ scene: document.body.dataset.gameScene, contextLost: window.__KINDWORKS_PHASER_GAME__?.renderer?.gl?.isContextLost?.(), loopRunning: window.__KINDWORKS_PHASER_GAME__?.loop?.running, activeScenes: window.__KINDWORKS_PHASER_GAME__?.scene?.getScenes?.(true)?.map((scene) => scene.scene.key) }));
    return { support, before, lost, recovered, logs };
  } finally { await context.close(); }
}

async function auditFailedAsset(browser) {
  const profile = PROFILES[1], context = await newContext(browser, profile), page = await context.newPage(), logs = observeErrors(page);
  const blockedPattern = "fishing-reedbank-background.v1.webp";
  await page.route(`**/*${blockedPattern}*`, (route) => route.abort("failed"));
  try {
    await page.goto(`${baseUrl}/?qa=fidelity&asset-failure-audit=true`, { waitUntil: "domcontentloaded" });
    await waitForGame(page);
    const transitionMilliseconds = await openActivity(page, "fishing", "FishingScene");
    const result = await page.evaluate(() => {
      const game = window.__KINDWORKS_PHASER_GAME__, registry = game?.registry?.get?.("visualRegistry");
      return {
        scene: document.body.dataset.gameScene,
        active: game?.scene?.isActive?.("FishingScene"),
        fallbackTextureExists: game?.textures?.exists?.("kw.asset.scene.fishing.reedbank.background"),
        failures: registry?.getFailures?.() || [],
        saveDiagnostics: window.__KINDWORKS_PHASER__?.getSaveDiagnostics?.(),
      };
    });
    return { blockedPattern, transitionMilliseconds, result, logs };
  } finally { await context.close(); }
}

await mkdir(path.join(outputRoot, "screenshots"), { recursive: true });
const server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverErrors = ""; server.stderr.on("data", (chunk) => { serverErrors += chunk; });
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), environment: { browser: "Playwright Chromium headless", physicalDevice: false }, profiles: [], referenceOverlay: [], assetLab: [], orientation: [], performance: null, throttled: null, contextRecovery: null, failedAsset: null, fatalError: null };
try {
  await waitForServer(server);
  const browser = await chromium.launch({ headless: true, args: ["--enable-precise-memory-info"] });
  try {
    for (const profile of PROFILES) {
      console.log(`Auditing ${profile.id} ${profile.width}x${profile.height}...`);
      report.profiles.push(await runProfile(browser, profile));
    }
    for (const profile of [PROFILES[0], PROFILES[2], PROFILES[4], PROFILES[5]]) report.referenceOverlay.push(await auditReferenceOverlay(browser, profile));
    for (const profile of [PROFILES[0], PROFILES[2], PROFILES[4], PROFILES[6]]) report.assetLab.push(await auditAssetLab(browser, profile));
    report.orientation = await auditOrientation(browser);
    report.performance = await auditPerformance(browser);
    report.throttled = await auditThrottled(browser);
    report.contextRecovery = await auditContextRecovery(browser);
    report.failedAsset = await auditFailedAsset(browser);
  } finally { await browser.close(); }
} catch (error) {
  report.fatalError = { name: error.name, message: error.message, stack: error.stack };
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2000))]);
}
report.serverErrors = serverErrors && !/Browserslist/.test(serverErrors) ? serverErrors : "";
await writeFile(path.join(outputRoot, "RESULT.json"), `${JSON.stringify(report, null, 2)}\n`);
if (report.fatalError) { console.error(report.fatalError.stack); process.exitCode = 1; }
else console.log(`Mobile visual-readiness audit complete: ${report.profiles.length} profiles, ${report.performance.transitions.length} stress transitions.`);
