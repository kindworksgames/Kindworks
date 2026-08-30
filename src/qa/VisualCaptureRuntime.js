import { getVisualCaptureCase, validateVisualCaptureRequest } from "./visualComparisonContracts.js";

const CAPTURE_STYLE_ID = "kw-visual-capture-style";

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function setStatus(status, details = {}) {
  document.body.dataset.visualRegressionReady = status === "ready" ? "true" : status;
  document.body.dataset.visualCaptureStatus = status;
  document.body.dataset.visualCaptureDetails = JSON.stringify(details);
}

function fail(code, message, details = {}) {
  const error = { ok: false, code, message, ...details };
  console.error(`[visual-capture:${code}] ${message}`, details);
  setStatus("failed", error);
  window.__KINDWORKS_VISUAL_CAPTURE__ = error;
  return error;
}

function installCaptureSafeStyle() {
  document.querySelector(`#${CAPTURE_STYLE_ID}`)?.remove();
  const style = document.createElement("style");
  style.id = CAPTURE_STYLE_ID;
  style.textContent = `
    html.kw-visual-capture *,html.kw-visual-capture *::before,html.kw-visual-capture *::after{animation:none!important;transition:none!important;caret-color:transparent!important}
    html.kw-visual-capture #kw-reference-overlay,
    html.kw-visual-capture #kw-reference-comparison-surface,
    html.kw-visual-capture [data-development-only="true"],
    html.kw-visual-capture [data-qa-overlay="true"]{visibility:hidden!important;pointer-events:none!important}
  `;
  document.head.append(style);
  document.documentElement.classList.add("kw-visual-capture");
}

function texturesReady(game) {
  const manager = game?.textures;
  if (!manager) return false;
  return !manager.list || Object.values(manager.list).every((texture) => texture?.source?.every?.((source) => source?.image) !== false);
}

function activeScene(game, key) {
  const scene = game?.scene?.getScene?.(key);
  return scene?.scene?.isActive?.() ? scene : null;
}

function applyCameraContract(scene, cameraContract) {
  const camera = scene.cameras?.main;
  if (!camera) throw new Error(`${scene.scene.key} has no main camera.`);
  camera.stopFollow?.();
  camera.setZoom(cameraContract.zoom);
  camera.centerOn(cameraContract.centerX, cameraContract.centerY);
  camera.roundPixels = true;
  return { centerX: camera.midPoint.x, centerY: camera.midPoint.y, zoom: camera.zoom };
}

function freezeScene(scene) {
  scene.tweens?.pauseAll?.();
  if (scene.time) scene.time.paused = true;
  scene.physics?.world?.pause?.();
  scene.anims?.pauseAll?.();
  scene.scene.pause();
}

function normalizeDeterministicPresentation(scene) {
  for (const tween of scene.tweens?.getTweens?.() || []) {
    tween.seek?.(0);
    tween.pause?.();
  }
  if (scene.scene.key !== "TownScene") return;
  for (const character of scene.npcCharacters?.values?.() || []) {
    character.walkPhase = (Number(character.residentId?.slice?.(-2)) || 1) * 0.73;
  }
  const presentations = scene.animals?.getWorldPresentations?.() || [];
  for (const presentation of presentations) {
    const character = scene.animalCharacters?.get?.(presentation.definition.id);
    if (!character) continue;
    character.phase = presentation.definition.initialTrust * 0.37;
    character.relocation = null;
    character.relocationAlpha = 1;
    character.presentationAlpha = presentation.visible ? 1 : 0;
    character.lastPresentationVisible = Boolean(presentation.visible);
    const target = presentation.location === "following"
      ? { x: scene.player.x - 45, y: scene.player.y + 42 }
      : presentation.position;
    if (target) character.setPosition(target.x, target.y);
  }
  // Production presentation updates are cadence-bound; the visual gate asks
  // for an explicit zero-time projection so its frozen frame does not depend
  // on which side of that cadence the browser happened to settle on.
  scene.refreshTownCharacterPresentations?.(0);
  scene.update?.(0, 0);
}

export async function prepareVisualCapture({ game, captureId, openActivity }) {
  setStatus("preparing", { captureId });
  installCaptureSafeStyle();
  const request = validateVisualCaptureRequest({ id: captureId, width: window.innerWidth, height: window.innerHeight });
  if (!request.ok) return fail(request.code, request.message);
  const captureCase = request.captureCase;
  const scenario = captureCase.scenario;

  if (scenario !== "town") {
    const townDeadline = performance.now() + 10_000;
    while (!activeScene(game, "TownScene") && performance.now() < townDeadline) await nextFrame();
    if (!activeScene(game, "TownScene")) return fail("town-entry-timeout", `${captureId} could not reach the deterministic town entry state.`);
    const scenarioDefinition = getVisualCaptureCase(captureId);
    const activityId = {
      "house-interior": "house-interior",
      "village-grocer": "village-grocer",
      "corner-cafe": "cafe",
      "lawn-care": "lawn",
      powerwash: "powerwash",
    }[scenarioDefinition.scenario];
    if (!activityId) return fail("missing-scene-entry", `${captureId} has no deterministic entry action.`);
    const result = await openActivity(activityId, 1);
    if (!result?.ok) return fail("scene-entry-failed", `${captureId} could not enter ${activityId}.`, { result });
  }

  const deadline = performance.now() + 10_000;
  let scene = activeScene(game, captureCase.scene);
  while ((!scene || !texturesReady(game)) && performance.now() < deadline) {
    await nextFrame();
    scene = activeScene(game, captureCase.scene);
  }
  if (!scene) return fail("wrong-active-scene", `${captureId} expected ${captureCase.scene}, but it did not become active.`, { activeScenes: game.scene.getScenes(true).map((item) => item.scene.key) });
  if (!texturesReady(game)) return fail("textures-not-ready", `${captureId} has unresolved textures.`);
  if (captureCase.readySelector) {
    const stateDeadline = performance.now() + 10_000;
    while (!document.querySelector(captureCase.readySelector) && performance.now() < stateDeadline) await nextFrame();
    if (!document.querySelector(captureCase.readySelector)) return fail("state-not-ready", `${captureId} did not reach ${captureCase.expectedState}.`, { selector: captureCase.readySelector });
  }
  const fadeDeadline = performance.now() + 10_000;
  while (scene.cameras?.main?.fadeEffect?.isRunning && performance.now() < fadeDeadline) await nextFrame();
  if (scene.cameras?.main?.fadeEffect?.isRunning) return fail("camera-fade-timeout", `${captureId} camera fade did not settle.`);
  if (document.fonts?.ready) await document.fonts.ready;

  const camera = applyCameraContract(scene, captureCase.camera);
  for (let index = 0; index < captureCase.settle.frames; index += 1) await nextFrame();
  normalizeDeterministicPresentation(scene);
  freezeScene(scene);
  await nextFrame();

  const actualCamera = scene.cameras.main;
  const epsilon = 0.01;
  const actualCameraContract = { centerX: actualCamera.midPoint.x, centerY: actualCamera.midPoint.y, zoom: actualCamera.zoom };
  if (Math.abs(actualCamera.zoom - captureCase.camera.zoom) > epsilon
    || Math.abs(actualCamera.midPoint.x - captureCase.camera.centerX) > epsilon
    || Math.abs(actualCamera.midPoint.y - captureCase.camera.centerY) > epsilon) {
    return fail("camera-mismatch", `${captureId} camera did not match its contract.`, { expected: captureCase.camera, applied: camera, actual: actualCameraContract });
  }
  if (window.innerWidth !== captureCase.viewport.width || window.innerHeight !== captureCase.viewport.height) {
    return fail("viewport-changed", `${captureId} viewport changed while preparing.`);
  }

  const ready = {
    ok: true,
    status: "ready",
    schemaVersion: captureCase.schemaVersion,
    captureId,
    scenario,
    expectedState: captureCase.expectedState,
    family: captureCase.family,
    scene: captureCase.scene,
    profile: captureCase.profile,
    viewport: captureCase.viewport,
    camera: actualCameraContract,
    seed: captureCase.seed,
    debugUiExcluded: true,
    frozen: true,
  };
  window.__KINDWORKS_VISUAL_CAPTURE__ = ready;
  document.body.dataset.visualRegressionScenario = scenario;
  document.body.dataset.visualCaptureId = captureId;
  setStatus("ready", ready);
  return ready;
}
