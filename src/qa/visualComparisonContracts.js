export const VISUAL_COMPARISON_SCHEMA_VERSION = 2;
export const VISUAL_COMPARISON_SEED = 0x4b574332;

export const VISUAL_DEVICE_PROFILES = Object.freeze({
  "narrow-phone": Object.freeze({ width: 568, height: 320, deviceScaleFactor: 1, kind: "phone" }),
  "modern-phone": Object.freeze({ width: 844, height: 390, deviceScaleFactor: 1, kind: "phone" }),
  "tablet-4x3": Object.freeze({ width: 1024, height: 768, deviceScaleFactor: 1, kind: "tablet" }),
  reference: Object.freeze({ width: 1280, height: 720, deviceScaleFactor: 1, kind: "reference" }),
  desktop: Object.freeze({ width: 1366, height: 768, deviceScaleFactor: 1, kind: "desktop" }),
});

const DEFAULT_POLICY = Object.freeze({
  channelDeltaThreshold: 8,
  maxChangedPixelRatio: 0.0025,
  maxMeanAbsoluteError: 0.65,
  includeAlpha: true,
});

function capture(id, scenario, family, scene, profile, options = {}) {
  const device = VISUAL_DEVICE_PROFILES[profile];
  return Object.freeze({
    schemaVersion: VISUAL_COMPARISON_SCHEMA_VERSION,
    id,
    scenario,
    family,
    scene,
    profile,
    viewport: Object.freeze({ width: device.width, height: device.height }),
    seed: VISUAL_COMPARISON_SEED,
    expectedState: options.expectedState || "ready",
    readySelector: options.readySelector || null,
    camera: Object.freeze(options.camera || { centerX: 640, centerY: 360, zoom: 1 }),
    settle: Object.freeze({ frames: 2, fonts: true, textures: true }),
    policy: Object.freeze({ ...DEFAULT_POLICY, ...(options.policy || {}) }),
    referenceId: options.referenceId || null,
  });
}

const townCamera = (profile) => ({
  centerX: profile === "narrow-phone" ? 1280 / (2 * 0.3) : 2100,
  centerY: 1400,
  zoom: profile === "narrow-phone" ? 0.3 : 0.39,
});

export const VISUAL_CAPTURE_CASES = Object.freeze([
  capture("town--narrow-phone", "town", "world", "TownScene", "narrow-phone", { camera: townCamera("narrow-phone") }),
  capture("town--modern-phone", "town", "world", "TownScene", "modern-phone", { camera: townCamera("modern-phone") }),
  capture("town--tablet-4x3", "town", "world", "TownScene", "tablet-4x3", { camera: townCamera("tablet-4x3") }),
  capture("town--reference", "town", "world", "TownScene", "reference", { camera: townCamera("reference") }),
  capture("town--desktop", "town", "world", "TownScene", "desktop", { camera: townCamera("desktop") }),
  capture("house-interior--tablet-4x3", "house-interior", "interior", "HouseInteriorScene", "tablet-4x3", { readySelector: "body[data-game-scene='HouseInteriorScene']" }),
  capture("village-grocer--modern-phone", "village-grocer", "shop", "VillageGrocerScene", "modern-phone", { expectedState: "product-panel", readySelector: "#shop-panel:not(.hidden)" }),
  capture("corner-cafe--modern-phone", "corner-cafe", "restaurant", "CafeScene", "modern-phone", { expectedState: "level-selection", readySelector: "#cafe-hud:not(.hidden) #cafe-level-select" }),
  capture("lawn-care--narrow-phone", "lawn-care", "cleanup", "LawnCareScene", "narrow-phone"),
  capture("powerwash--tablet-4x3", "powerwash", "special-renderer", "PlaygroundPowerwashScene", "tablet-4x3", { expectedState: "approved-artwork-ready", readySelector: "#powerwash-board[aria-label='Washable playground surface']" }),
]);

export const VISUAL_CAPTURE_BY_ID = new Map(VISUAL_CAPTURE_CASES.map((entry) => [entry.id, entry]));

export function getVisualCaptureCase(id) {
  return VISUAL_CAPTURE_BY_ID.get(id) || null;
}

export function resolveVisualCaptureCase({ id, scenario, width, height }) {
  if (id) return getVisualCaptureCase(id);
  return VISUAL_CAPTURE_CASES.find((entry) => entry.scenario === scenario
    && entry.viewport.width === Number(width)
    && entry.viewport.height === Number(height)) || null;
}

export function validateVisualCaptureRequest({ id, width, height }) {
  const captureCase = getVisualCaptureCase(id);
  if (!captureCase) return { ok: false, code: "unknown-capture-case", message: `Unknown visual capture case: ${id || "(missing)"}.` };
  if (Number(width) !== captureCase.viewport.width || Number(height) !== captureCase.viewport.height) {
    return {
      ok: false,
      code: "viewport-mismatch",
      message: `${id} requires ${captureCase.viewport.width}x${captureCase.viewport.height}; received ${width}x${height}.`,
      captureCase,
    };
  }
  return { ok: true, captureCase };
}

export function createSeededRandom(seed = VISUAL_COMPARISON_SEED) {
  let state = Number(seed) >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function validateVisualComparisonContracts(cases = VISUAL_CAPTURE_CASES) {
  const errors = [];
  const ids = new Set();
  for (const entry of cases) {
    if (ids.has(entry.id)) errors.push(`Duplicate visual capture ID: ${entry.id}`);
    ids.add(entry.id);
    const profile = VISUAL_DEVICE_PROFILES[entry.profile];
    if (!profile) errors.push(`${entry.id} references unknown profile ${entry.profile}.`);
    else if (entry.viewport.width !== profile.width || entry.viewport.height !== profile.height) errors.push(`${entry.id} viewport does not match ${entry.profile}.`);
    if (!entry.scene || !entry.scenario || !entry.family) errors.push(`${entry.id} is missing scene, scenario, or family.`);
    if (entry.readySelector !== null && typeof entry.readySelector !== "string") errors.push(`${entry.id} has an invalid ready selector.`);
    if (!(entry.policy.maxChangedPixelRatio >= 0 && entry.policy.maxChangedPixelRatio <= 1)) errors.push(`${entry.id} has an invalid changed-pixel threshold.`);
  }
  return { ok: errors.length === 0, errors };
}
