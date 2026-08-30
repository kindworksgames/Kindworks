import { SHADOW_POLICY_IDS, MEASURED_WORLD_REFERENCES } from "./scaleSystem.js";

const rect = (x, y, width, height) => Object.freeze({ kind: "rectangle", x, y, width, height });
const circle = (x, y, radius) => Object.freeze({ kind: "circle", x, y, radius });

export const SCALE_CALIBRATION_FIXTURE_VERSION = 1;

export const SCALE_CALIBRATION_OBJECTS = Object.freeze({
  player: Object.freeze({
    id: "calibration.player",
    label: "Player · 40×54",
    visual: rect(-20, -47.52, 40, 54),
    collision: circle(0, 0, 18),
    navigation: circle(0, 0, 18),
    interaction: circle(0, 0, 38),
    touch: rect(-22, -44, 44, 44),
    groundContact: Object.freeze({ x: 0, y: 0 }),
    shadowPolicy: SHADOW_POLICY_IDS.SHARED,
  }),
  npc: Object.freeze({
    id: "calibration.npc",
    label: "NPC · 42×66 touch body",
    visual: rect(-21, -47, 42, 66),
    collision: circle(0, 0, 18),
    navigation: circle(0, 0, 18),
    interaction: circle(0, 0, 78),
    touch: rect(-21, -47, 42, 66),
    groundContact: Object.freeze({ x: 0, y: 19 }),
    shadowPolicy: SHADOW_POLICY_IDS.SHARED,
  }),
  compactHouse: Object.freeze({
    id: "calibration.house.compact",
    label: "Compact cottage · 190×140",
    visual: rect(-95, -140, 190, 140),
    collision: rect(-103, -155, 206, 158),
    navigation: rect(-103, -155, 206, 158),
    interaction: circle(0, 42, 86),
    touch: rect(-44, 0, 88, 88),
    groundContact: Object.freeze({ x: 0, y: 0 }),
    shadowPolicy: SHADOW_POLICY_IDS.CUSTOM,
    technical: Object.freeze({ width: 190, height: 140, nativePixelsPerLogicalUnit: 1 }),
  }),
  standardHouse: Object.freeze({
    id: "calibration.house.standard",
    label: "Standard cottage · 195×145",
    visual: rect(-97.5, -145, 195, 145),
    collision: rect(-105.5, -160, 211, 163),
    navigation: rect(-105.5, -160, 211, 163),
    interaction: circle(0, 42, 86),
    touch: rect(-44, 0, 88, 88),
    groundContact: Object.freeze({ x: 0, y: 0 }),
    shadowPolicy: SHADOW_POLICY_IDS.CUSTOM,
    technical: Object.freeze({ width: 195, height: 145, nativePixelsPerLogicalUnit: 1 }),
  }),
  oversizedReplacementHouse: Object.freeze({
    id: "calibration.house.oversized-source-proof",
    label: "4096px source → 195×145 logical",
    visual: rect(-97.5, -145, 195, 145),
    collision: rect(-105.5, -160, 211, 163),
    navigation: rect(-105.5, -160, 211, 163),
    interaction: circle(0, 42, 86),
    touch: rect(-44, 0, 88, 88),
    groundContact: Object.freeze({ x: 0, y: 0 }),
    shadowPolicy: SHADOW_POLICY_IDS.CUSTOM,
    technical: Object.freeze({ width: 4096, height: 4096, nativePixelsPerLogicalUnit: 4 }),
  }),
  tree: Object.freeze({
    id: "calibration.tree.town",
    label: "Town tree · 87×97 visual / r50 footprint",
    visual: Object.freeze({ kind: "rectangle", ...MEASURED_WORLD_REFERENCES.tree.visualBounds }),
    collision: circle(0, 0, MEASURED_WORLD_REFERENCES.tree.placeableFootprintRadius),
    navigation: circle(0, 0, MEASURED_WORLD_REFERENCES.tree.placeableFootprintRadius),
    interaction: circle(0, 0, 76),
    touch: rect(-50, -50, 100, 100),
    groundContact: MEASURED_WORLD_REFERENCES.tree.groundContactOffset,
    shadowPolicy: SHADOW_POLICY_IDS.SHARED,
    technical: Object.freeze({ width: 4096, height: 4096, nativePixelsPerLogicalUnit: 4 }),
  }),
  bench: Object.freeze({
    id: "calibration.bench.town",
    label: "Bench · 80×50 / r42 footprint",
    visual: rect(-40, -25, 80, 50),
    collision: circle(0, 0, 42),
    navigation: circle(0, 0, 42),
    interaction: circle(0, 0, 76),
    touch: rect(-42, -42, 84, 84),
    groundContact: Object.freeze({ x: 0, y: 25 }),
    shadowPolicy: SHADOW_POLICY_IDS.CUSTOM,
  }),
  bin: Object.freeze({
    id: "calibration.bin.town",
    label: "Bin pilot · 54×54 / r28 footprint",
    visual: rect(-27, -23, 54, 54),
    collision: circle(0, 0, 20.16),
    navigation: circle(0, 0, 42),
    interaction: circle(0, 0, 76),
    touch: rect(-28, -28, 56, 56),
    groundContact: Object.freeze({ x: 0, y: 23 }),
    shadowPolicy: SHADOW_POLICY_IDS.CUSTOM,
  }),
  door: Object.freeze({
    id: "calibration.door.standard-house",
    label: "House door · 34×61",
    visual: rect(-17, -61, 34, 61),
    collision: null,
    navigation: null,
    interaction: circle(0, 42, 86),
    touch: rect(-22, -22, 44, 44),
    groundContact: Object.freeze({ x: 0, y: 0 }),
    shadowPolicy: SHADOW_POLICY_IDS.NONE,
  }),
  fence: Object.freeze({
    id: "calibration.fence.grid-section",
    label: "Grid-aligned fence · 96×32",
    visual: rect(-48, -32, 96, 32),
    collision: rect(-48, -12, 96, 12),
    navigation: rect(-48, -12, 96, 12),
    interaction: null,
    touch: null,
    groundContact: Object.freeze({ x: 0, y: 0 }),
    shadowPolicy: SHADOW_POLICY_IDS.NONE,
    status: "calibration-only-until-fence-prefab-migration",
  }),
});

export function validateCalibrationFixtures(fixtures = SCALE_CALIBRATION_OBJECTS) {
  const errors = [];
  const ids = new Set();
  for (const fixture of Object.values(fixtures)) {
    if (!fixture?.id || ids.has(fixture.id)) errors.push(`duplicate-or-missing-fixture-id:${fixture?.id || "unknown"}`);
    ids.add(fixture?.id);
    if (!fixture?.visual || fixture.visual.width <= 0 || fixture.visual.height <= 0) errors.push(`invalid-visual:${fixture?.id || "unknown"}`);
    if (!fixture?.groundContact) errors.push(`missing-ground-contact:${fixture?.id || "unknown"}`);
    if (!fixture?.shadowPolicy) errors.push(`missing-shadow-policy:${fixture?.id || "unknown"}`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
