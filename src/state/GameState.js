import { PLAYER_START, WORLD } from "../data/town.js";
import { GAME_STATE_SCHEMA_VERSION } from "./constants.js";
import {
  createFreshEconomyState,
  createFreshInventoryState,
  projectLegacyEconomy,
  projectLegacyInventory,
  validateEconomyState,
  validateInventoryState,
} from "./economyState.js";
import { createFreshCleanupState, normalizeCleanupState, validateCleanupState } from "./cleanupState.js";

const DIRECTIONS = new Set(["up", "down", "left", "right"]);

function isoTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeTownName(value) {
  const name = String(value || "Willowmere")
    .replace(/[^\p{L}\p{N} '’\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
  return name || "Willowmere";
}

function safeInteger(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

export function createFreshGameState({ now = Date.now() } = {}) {
  const timestamp = isoTime(now) || new Date(0).toISOString();
  return {
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: {
      kind: "new",
      legacyVersion: null,
      legacySourceKey: null,
      importedAt: null,
      warnings: [],
    },
    identity: { townName: "Willowmere" },
    world: { day: 1, clockMinutes: 480 },
    player: {
      scene: "TownScene",
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      facing: "down",
    },
    progress: { completedJobCount: 0, cleanup: createFreshCleanupState() },
    economy: createFreshEconomyState({ now }),
    inventory: createFreshInventoryState(),
    legacySnapshot: null,
  };
}

export function createGameStateFromLegacy(legacy, report, { now = Date.now() } = {}) {
  if (!legacy || typeof legacy !== "object") throw new TypeError("A parsed legacy save is required.");
  if (!report?.ok) throw new TypeError("A successful legacy validation report is required.");
  const state = createFreshGameState({ now });
  state.source = {
    kind: "legacy-import",
    legacyVersion: Number(legacy.version),
    legacySourceKey: report.sourceKey,
    importedAt: state.updatedAt,
    warnings: [...(report.warnings || [])],
  };
  state.identity.townName = safeTownName(legacy.playerSetup?.townName);
  state.world.day = safeInteger(legacy.worldDay, 1);
  state.world.clockMinutes = safeInteger(legacy.worldClockMinutes, 0, 1439);
  state.progress.completedJobCount = safeInteger(legacy.completedJobCount, 0);
  state.economy = projectLegacyEconomy(legacy.economy, { now });
  state.inventory = projectLegacyInventory({
    ...(legacy.economy?.inventory || {}),
    equipped: legacy.economy?.equipped,
  });
  state.legacySnapshot = structuredClone(legacy);
  return state;
}

export function upgradeGameState(value, { now = Date.now() } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const state = structuredClone(value);
  if (state.schemaVersion === 1) {
    const legacyEconomy = state.legacySnapshot?.economy;
    state.economy = legacyEconomy
      ? projectLegacyEconomy(legacyEconomy, { now })
      : createFreshEconomyState({ now });
    state.inventory = legacyEconomy
      ? projectLegacyInventory({ ...(legacyEconomy.inventory || {}), equipped: legacyEconomy.equipped })
      : createFreshInventoryState();
    state.schemaVersion = 2;
  }
  if (state.schemaVersion === 2) {
    if (!state.progress || typeof state.progress !== "object") state.progress = { completedJobCount: 0 };
    state.progress.cleanup = normalizeCleanupState(state.progress.cleanup);
    state.schemaVersion = GAME_STATE_SCHEMA_VERSION;
  }
  return state;
}

export function validateGameState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: ["Game state must be an object."] };
  }
  if (value.schemaVersion !== GAME_STATE_SCHEMA_VERSION) errors.push("Unsupported game-state schema version.");
  if (!isoTime(value.createdAt)) errors.push("createdAt must be an ISO-compatible timestamp.");
  if (!isoTime(value.updatedAt)) errors.push("updatedAt must be an ISO-compatible timestamp.");
  if (!value.source || !["new", "legacy-import"].includes(value.source.kind)) errors.push("State source is invalid.");
  if (!value.identity || typeof value.identity.townName !== "string" || !value.identity.townName.trim()) errors.push("Town name is missing.");
  if (!Number.isInteger(value.world?.day) || value.world.day < 1) errors.push("World day must be a positive integer.");
  if (!Number.isInteger(value.world?.clockMinutes) || value.world.clockMinutes < 0 || value.world.clockMinutes > 1439) errors.push("World clock must be between 0 and 1439 minutes.");
  if (!value.player || !Number.isFinite(value.player.x) || !Number.isFinite(value.player.y)) errors.push("Player position is invalid.");
  else if (value.player.x < 0 || value.player.x > WORLD.width || value.player.y < 0 || value.player.y > WORLD.height) errors.push("Player position is outside the authored world.");
  if (!DIRECTIONS.has(value.player?.facing)) errors.push("Player facing direction is invalid.");
  if (typeof value.player?.scene !== "string" || !value.player.scene) errors.push("Player scene is missing.");
  if (!Number.isInteger(value.progress?.completedJobCount) || value.progress.completedJobCount < 0) errors.push("Completed-job count is invalid.");
  errors.push(...validateCleanupState(value.progress?.cleanup).errors);
  errors.push(...validateEconomyState(value.economy).errors);
  errors.push(...validateInventoryState(value.inventory).errors);
  if (value.source?.kind === "legacy-import") {
    if (!Number.isInteger(value.source.legacyVersion)) errors.push("Imported legacy version is missing.");
    if (typeof value.source.legacySourceKey !== "string") errors.push("Imported legacy source key is missing.");
    if (!value.legacySnapshot || typeof value.legacySnapshot !== "object") errors.push("Imported legacy snapshot is missing.");
  }
  return { ok: errors.length === 0, errors };
}

export class GameStateService {
  constructor(initialState = createFreshGameState()) {
    const upgraded = upgradeGameState(initialState);
    const validation = validateGameState(upgraded);
    if (!validation.ok) throw new TypeError(validation.errors.join(" "));
    this.state = structuredClone(upgraded);
    this.listeners = new Set();
  }

  getSnapshot() {
    return structuredClone(this.state);
  }

  replace(nextState) {
    const validation = validateGameState(nextState);
    if (!validation.ok) return validation;
    this.state = structuredClone(nextState);
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
    return { ok: true, state: snapshot };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A state listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updatePlayer({ scene, x, y, facing }, { now = Date.now() } = {}) {
    const next = this.getSnapshot();
    if (typeof scene === "string" && scene) next.player.scene = scene;
    if (Number.isFinite(x)) next.player.x = Number(x);
    if (Number.isFinite(y)) next.player.y = Number(y);
    if (DIRECTIONS.has(facing)) next.player.facing = facing;
    next.updatedAt = isoTime(now) || next.updatedAt;
    return this.replace(next);
  }
}
