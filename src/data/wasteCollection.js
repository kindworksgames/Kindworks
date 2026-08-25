import {
  WASTE_BUILD_VERSION,
  WASTE_CERTIFIED_SOLUTIONS,
  WASTE_CHECKPOINT_LEVELS,
  WASTE_LEVEL_DATA,
  WASTE_PAYLOAD_SHA256,
  WASTE_RUBBISH_CATALOG,
  WASTE_SOURCE_LEVELS,
  WASTE_SOURCE_SHA256,
  WASTE_TILE_STRIDE,
  WASTE_TOTAL_LEVELS,
  WASTE_TRAY_LIMIT,
  WASTE_WORLD,
} from "./wasteCollectionData.js";

export {
  WASTE_BUILD_VERSION,
  WASTE_CERTIFIED_SOLUTIONS,
  WASTE_CHECKPOINT_LEVELS,
  WASTE_PAYLOAD_SHA256,
  WASTE_RUBBISH_CATALOG,
  WASTE_SOURCE_LEVELS,
  WASTE_SOURCE_SHA256,
  WASTE_TOTAL_LEVELS,
  WASTE_TRAY_LIMIT,
  WASTE_WORLD,
};

function clampLevel(value) {
  return Math.max(1, Math.min(WASTE_TOTAL_LEVELS, Math.floor(Number(value) || 1)));
}

export function wasteTilesOverlap(a, b) {
  const margin = 10;
  return a.x + margin < b.x + WASTE_WORLD.cardWidth - margin
    && a.x + WASTE_WORLD.cardWidth - margin > b.x + margin
    && a.y + margin < b.y + WASTE_WORLD.cardHeight - margin
    && a.y + WASTE_WORLD.cardHeight - margin > b.y + margin;
}

export function wasteTileExposed(tiles, tile) {
  if (!tile || tile.removed) return false;
  return !tiles.some((other) => !other.removed && other.layer > tile.layer && wasteTilesOverlap(tile, other));
}

export function decodeWasteLevel(levelValue) {
  const level = clampLevel(levelValue);
  const data = WASTE_LEVEL_DATA[level];
  if (!Array.isArray(data)) throw new RangeError(`Waste Collection Level ${level} is missing.`);
  const tiles = [];
  for (let offset = 0, id = 0; offset < data.length; offset += WASTE_TILE_STRIDE, id += 1) {
    const typeId = data[offset];
    const rubbish = WASTE_RUBBISH_CATALOG[typeId];
    tiles.push({
      id,
      typeId,
      type: rubbish.key,
      label: rubbish.label,
      icon: rubbish.icon,
      x: data[offset + 1],
      y: data[offset + 2],
      layer: data[offset + 3],
      rotation: data[offset + 4],
      removed: false,
    });
  }
  return tiles;
}

export function wasteLevelSummary(levelValue) {
  const level = clampLevel(levelValue);
  const data = WASTE_LEVEL_DATA[level];
  const types = new Set();
  let maxLayer = 0;
  for (let offset = 0; offset < data.length; offset += WASTE_TILE_STRIDE) {
    types.add(data[offset]);
    maxLayer = Math.max(maxLayer, data[offset + 3]);
  }
  const progress = (level - 1) / (WASTE_TOTAL_LEVELS - 1);
  return {
    level,
    tileCount: data.length / WASTE_TILE_STRIDE,
    typeCount: types.size,
    layers: maxLayer + 1,
    sourceLevel: WASTE_SOURCE_LEVELS[level - 1],
    checkpoint: WASTE_CHECKPOINT_LEVELS.includes(level),
    difficulty: Math.round(40 + 45 * Math.pow(progress, 0.9)),
  };
}

export class WasteCollectionEngine {
  constructor(levelValue, saved = null) {
    this.level = clampLevel(levelValue);
    this.tiles = decodeWasteLevel(this.level);
    const removed = new Set(Array.isArray(saved?.removedIds) ? saved.removedIds : []);
    for (const tile of this.tiles) tile.removed = removed.has(tile.id);
    this.tray = Array.isArray(saved?.tray) ? saved.tray.filter((typeId) => Number.isInteger(typeId) && WASTE_RUBBISH_CATALOG[typeId]) : [];
    this.moves = Math.max(0, Math.floor(Number(saved?.moves) || 0));
    this.matches = Math.max(0, Math.floor(Number(saved?.matches) || 0));
    this.ended = Boolean(saved?.ended);
    this.won = Boolean(saved?.won);
  }

  exposedIds() {
    return this.tiles.filter((tile) => wasteTileExposed(this.tiles, tile)).map((tile) => tile.id);
  }

  select(tileId) {
    if (this.ended) return { ok: false, code: "attempt-ended", message: "This Waste Collection attempt has ended." };
    const tile = this.tiles.find((candidate) => candidate.id === Number(tileId));
    if (!tile) return { ok: false, code: "unknown-tile", message: "That rubbish card is not part of this level." };
    if (!wasteTileExposed(this.tiles, tile)) return { ok: false, code: "tile-blocked", message: `${tile.label} is still covered by another card.` };
    tile.removed = true;
    this.tray.push(tile.typeId);
    this.moves += 1;
    this.tray.sort((a, b) => a - b);
    let matchedTypeId = null;
    for (let index = 0; index <= this.tray.length - 3; index += 1) {
      if (this.tray[index] === this.tray[index + 1] && this.tray[index] === this.tray[index + 2]) {
        matchedTypeId = this.tray[index];
        this.tray.splice(index, 3);
        this.matches += 1;
        break;
      }
    }
    const remaining = this.tiles.filter((candidate) => !candidate.removed).length;
    if (remaining === 0) { this.ended = true; this.won = true; }
    else if (this.tray.length >= WASTE_TRAY_LIMIT) { this.ended = true; this.won = false; }
    return {
      ok: true,
      code: this.won ? "level-cleared" : this.ended ? "tray-full" : matchedTypeId === null ? "tile-collected" : "triple-matched",
      tile: { ...tile },
      matchedTypeId,
      state: this.snapshot(),
    };
  }

  snapshot() {
    const remaining = this.tiles.filter((tile) => !tile.removed).length;
    return {
      level: this.level,
      removedIds: this.tiles.filter((tile) => tile.removed).map((tile) => tile.id),
      tray: [...this.tray],
      moves: this.moves,
      matches: this.matches,
      remaining,
      total: this.tiles.length,
      percent: Math.round(((this.tiles.length - remaining) / this.tiles.length) * 100),
      exposedIds: this.exposedIds(),
      ended: this.ended,
      won: this.won,
    };
  }
}

export function verifyWasteSolution(levelValue, solution = WASTE_CERTIFIED_SOLUTIONS[clampLevel(levelValue)]) {
  const level = clampLevel(levelValue);
  const engine = new WasteCollectionEngine(level);
  if (!Array.isArray(solution) || solution.length !== engine.tiles.length || new Set(solution).size !== solution.length) {
    return { ok: false, level, reason: "The certified solution does not cover every tile exactly once." };
  }
  for (const tileId of solution) {
    const result = engine.select(tileId);
    if (!result.ok) return { ok: false, level, tileId, reason: result.message };
    if (result.code === "tray-full") return { ok: false, level, tileId, reason: "The certified path filled the five-slot tray." };
  }
  return { ok: engine.won && engine.tray.length === 0, level, moves: engine.moves, matches: engine.matches };
}

export function validateWasteCatalogue({ verifySolutions = false } = {}) {
  const errors = [];
  if (WASTE_RUBBISH_CATALOG.length !== 40) errors.push("Waste Collection must contain 40 rubbish types.");
  if (Object.keys(WASTE_LEVEL_DATA).length !== WASTE_TOTAL_LEVELS) errors.push("Waste Collection must contain 750 authored boards.");
  if (Object.keys(WASTE_CERTIFIED_SOLUTIONS).length !== WASTE_TOTAL_LEVELS) errors.push("Waste Collection must contain 750 certified solutions.");
  for (let level = 1; level <= WASTE_TOTAL_LEVELS; level += 1) {
    const data = WASTE_LEVEL_DATA[level];
    if (!Array.isArray(data) || !data.length || data.length % WASTE_TILE_STRIDE !== 0) { errors.push(`Level ${level} has invalid compact data.`); continue; }
    const counts = new Map();
    for (let offset = 0; offset < data.length; offset += WASTE_TILE_STRIDE) {
      const typeId = data[offset];
      counts.set(typeId, (counts.get(typeId) || 0) + 1);
      if (!WASTE_RUBBISH_CATALOG[typeId]) errors.push(`Level ${level} uses an unknown rubbish type.`);
      if (data[offset + 1] < 0 || data[offset + 2] < 0 || data[offset + 1] + WASTE_WORLD.cardWidth > WASTE_WORLD.width || data[offset + 2] + WASTE_WORLD.cardHeight > WASTE_WORLD.height) errors.push(`Level ${level} has a card outside the authored board.`);
      if (!Number.isInteger(data[offset + 3]) || data[offset + 3] < 0) errors.push(`Level ${level} has an invalid layer.`);
    }
    if ([...counts.values()].some((count) => count % 3 !== 0)) errors.push(`Level ${level} has a rubbish count that cannot match in triples.`);
    if (verifySolutions) {
      const verification = verifyWasteSolution(level);
      if (!verification.ok) errors.push(`Level ${level} certified solution failed: ${verification.reason}`);
    }
    if (errors.length > 30) break;
  }
  return { ok: errors.length === 0, errors, levels: WASTE_TOTAL_LEVELS, rubbishTypes: WASTE_RUBBISH_CATALOG.length, certifiedSolutions: Object.keys(WASTE_CERTIFIED_SOLUTIONS).length };
}
