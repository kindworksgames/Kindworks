import { PLAYER_START, WORLD } from "../data/town.js";
import { GAME_STATE_SCHEMA_VERSION } from "./constants.js";

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
    progress: { completedJobCount: 0 },
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
  state.legacySnapshot = structuredClone(legacy);
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
  if (value.source?.kind === "legacy-import") {
    if (!Number.isInteger(value.source.legacyVersion)) errors.push("Imported legacy version is missing.");
    if (typeof value.source.legacySourceKey !== "string") errors.push("Imported legacy source key is missing.");
    if (!value.legacySnapshot || typeof value.legacySnapshot !== "object") errors.push("Imported legacy snapshot is missing.");
  }
  return { ok: errors.length === 0, errors };
}

export class GameStateService {
  constructor(initialState = createFreshGameState()) {
    const validation = validateGameState(initialState);
    if (!validation.ok) throw new TypeError(validation.errors.join(" "));
    this.state = structuredClone(initialState);
  }

  getSnapshot() {
    return structuredClone(this.state);
  }

  replace(nextState) {
    const validation = validateGameState(nextState);
    if (!validation.ok) return validation;
    this.state = structuredClone(nextState);
    return { ok: true, state: this.getSnapshot() };
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
