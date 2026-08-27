export const POWERWASH_BUILD_VERSION = "1.1.0-kindworks-soap-restored";
export const POWERWASH_VISUAL_REVISION = "v33-pixel-soap-stains";
export const POWERWASH_SIMULATION_REVISION = "phase-3-continuous-spray-v1";
export const POWERWASH_TOTAL_LEVELS = 750;
export const POWERWASH_REWARD_CAP = 170;
export const POWERWASH_MINIMUM_CLEAN_PERCENT = 97;
export const POWERWASH_SOURCE_SHA256 = "0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5";
export const POWERWASH_PAYLOAD_SHA256 = "f42f6029151f7fe897f2f210b7ae3f44cac3952015f22f89e6ce1d2a9ee667ff";
export const POWERWASH_MASTER_ART_SHA256 = "0679fe2c14f28b750f61415641b73e6d17d1f35cbaadfc1a470a011d3cdd0f24";
export const POWERWASH_REFERENCE_DIRT_SHA256 = "5db4c213d34d1e435f74f03a49590f766e172f01d8ac97703dc090ded7d36736";

export const POWERWASH_GRID = Object.freeze({ columns: 48, rows: 24 });
export const POWERWASH_CANVAS = Object.freeze({
  width: 1536,
  height: 1024,
  wash: Object.freeze({ x: 54, y: 117, width: 1428, height: 706 }),
});
export const POWERWASH_NOZZLES = Object.freeze({
  precision: Object.freeze({ radius: 0.64, drain: 8.5, power: 1.15, label: "Precision" }),
  standard: Object.freeze({ radius: 1, drain: 12, power: 1, label: "Standard" }),
  wide: Object.freeze({ radius: 1.48, drain: 17, power: 0.82, label: "Wide" }),
});
export const POWERWASH_SOAP_TOOL = Object.freeze({ radius: 1.18, drain: 8.5, label: "Soap" });

const RESISTANT_ZONES = Object.freeze([
  [345, 250, 58, 40], [1190, 245, 62, 42], [515, 620, 68, 46], [1035, 625, 66, 46], [770, 475, 55, 39],
  [245, 730, 58, 38], [1300, 700, 61, 41], [850, 735, 54, 38], [640, 330, 52, 36], [1115, 455, 57, 39],
]);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function clampLevel(value) {
  return clamp(Math.floor(Number(value) || 1), 1, POWERWASH_TOTAL_LEVELS);
}

function seeded(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function powerwashDifficulty(levelValue) {
  const level = clampLevel(levelValue);
  const t = clamp((level - 1) / 749, 0, 1);
  return Object.freeze({
    level,
    t,
    blobs: Math.round(4 + t * 296),
    grit: Math.round(40 + t * 5960),
    baseRadius: Math.round(48 - t * 20),
    regen: 6 - t * 3.2,
    stainOpacity: 0.34 + t * 0.18,
    cleanStrength: 1 - t * 0.62,
    drainMult: 0.9 + t * 0.55,
    resistantStainCount: Math.min(RESISTANT_ZONES.length, 5 + Math.floor(t * 5)),
  });
}

function cellIndex(row, col) {
  return row * POWERWASH_GRID.columns + col;
}

function cellPosition(index) {
  return { row: Math.floor(index / POWERWASH_GRID.columns), col: index % POWERWASH_GRID.columns };
}

function zoneCells(level, rng) {
  const difficulty = powerwashDifficulty(level);
  const result = new Set();
  for (let zoneIndex = 0; zoneIndex < difficulty.resistantStainCount; zoneIndex += 1) {
    const [sourceX, sourceY, sourceRadiusX, sourceRadiusY] = RESISTANT_ZONES[zoneIndex];
    const jitter = level === 1 ? 0 : Math.round((rng() - 0.5) * 18);
    const centerCol = ((sourceX + jitter) / 1536) * POWERWASH_GRID.columns;
    const centerRow = ((sourceY - jitter - 100) / 752) * POWERWASH_GRID.rows;
    const radiusCol = Math.max(1, (sourceRadiusX / 1536) * POWERWASH_GRID.columns * 2.2);
    const radiusRow = Math.max(1, (sourceRadiusY / 752) * POWERWASH_GRID.rows * 2.2);
    for (let row = 0; row < POWERWASH_GRID.rows; row += 1) {
      for (let col = 0; col < POWERWASH_GRID.columns; col += 1) {
        const distance = ((col + 0.5 - centerCol) ** 2) / (radiusCol ** 2) + ((row + 0.5 - centerRow) ** 2) / (radiusRow ** 2);
        if (distance < 1 && rng() <= Math.pow(1 - distance, 0.42) * 0.91) result.add(cellIndex(row, col));
      }
    }
  }
  return result;
}

export function generatePowerwashLevel(levelValue) {
  const difficulty = powerwashDifficulty(levelValue);
  const rng = seeded(9973 * difficulty.level + 42);
  const normal = new Map();
  const density = 0.68 + difficulty.t * 0.2;
  for (let row = 0; row < POWERWASH_GRID.rows; row += 1) {
    for (let col = 0; col < POWERWASH_GRID.columns; col += 1) {
      const edge = Math.min(row, col, POWERWASH_GRID.rows - 1 - row, POWERWASH_GRID.columns - 1 - col);
      const organic = rng() + (Math.sin(col * 0.71 + row * 0.37 + difficulty.level) + 1) * 0.08;
      if (organic < density || edge < 2) normal.set(cellIndex(row, col), Number((1 + difficulty.t * rng() * 0.65).toFixed(3)));
    }
  }
  const resistant = zoneCells(difficulty.level, rng);
  const initialCells = new Set([...normal.keys(), ...resistant]);
  return Object.freeze({
    ...difficulty,
    normal: Object.freeze([...normal.entries()].map(([index, strength]) => Object.freeze([index, strength]))),
    resistant: Object.freeze([...resistant]),
    initialDirtyCells: initialCells.size,
    fingerprint: `${difficulty.level}:${normal.size}:${resistant.size}:${[...normal.keys()].slice(0, 12).join("-")}`,
  });
}

function mapFromSaved(value, fallback) {
  if (!Array.isArray(value)) return new Map(fallback);
  return new Map(value.filter((entry) => Array.isArray(entry) && Number.isInteger(entry[0]) && entry[0] >= 0 && entry[0] < POWERWASH_GRID.columns * POWERWASH_GRID.rows && Number(entry[1]) > 0).map(([index, strength]) => [index, Number(Number(strength).toFixed(3))]));
}

export class PlaygroundPowerwashEngine {
  constructor(levelValue, saved = null) {
    this.level = generatePowerwashLevel(levelValue);
    this.normal = mapFromSaved(saved?.normal, this.level.normal);
    this.resistant = new Set(Array.isArray(saved?.resistant) ? saved.resistant.filter((index) => Number.isInteger(index) && this.level.resistant.includes(index)) : this.level.resistant);
    this.soaped = new Set(Array.isArray(saved?.soaped) ? saved.soaped.filter((index) => Number.isInteger(index) && this.resistant.has(index)) : []);
    this.water = clamp(Number(saved?.water ?? 100), 0, 100);
    this.soap = clamp(Number(saved?.soap ?? 100), 0, 100);
    this.toolMode = saved?.toolMode === "soap" ? "soap" : "water";
    this.nozzle = Object.hasOwn(POWERWASH_NOZZLES, saved?.nozzle) ? saved.nozzle : "precision";
    this.strokes = Math.max(0, Math.floor(Number(saved?.strokes) || 0));
    this.soapWarnings = Math.max(0, Math.floor(Number(saved?.soapWarnings) || 0));
    this.won = Boolean(saved?.won);
    this.rawPercentAtCompletion = this.won ? clamp(Number(saved?.rawPercentAtCompletion) || 100, POWERWASH_MINIMUM_CLEAN_PERCENT, 100) : 0;
  }

  selectTool(tool, nozzle = this.nozzle) {
    if (tool === "soap") this.toolMode = "soap";
    else {
      this.toolMode = "water";
      this.nozzle = Object.hasOwn(POWERWASH_NOZZLES, nozzle) ? nozzle : "precision";
    }
    return this.snapshot();
  }

  affectedCells(rowValue, colValue) {
    const row = clamp(Number(rowValue), 0, POWERWASH_GRID.rows - 1);
    const col = clamp(Number(colValue), 0, POWERWASH_GRID.columns - 1);
    const config = this.toolMode === "soap" ? POWERWASH_SOAP_TOOL : POWERWASH_NOZZLES[this.nozzle];
    const radius = Math.max(0.72, (this.level.baseRadius / 32) * config.radius);
    const cells = [];
    for (let candidateRow = Math.max(0, Math.floor(row - radius)); candidateRow <= Math.min(POWERWASH_GRID.rows - 1, Math.ceil(row + radius)); candidateRow += 1) {
      for (let candidateCol = Math.max(0, Math.floor(col - radius)); candidateCol <= Math.min(POWERWASH_GRID.columns - 1, Math.ceil(col + radius)); candidateCol += 1) {
        if (Math.hypot(candidateRow - row, candidateCol - col) <= radius) cells.push(cellIndex(candidateRow, candidateCol));
      }
    }
    return cells;
  }

  sprayAt(row, col, { deltaMs = 180 } = {}) {
    if (this.won) return { ok: false, code: "level-complete", message: "This playground is already clean." };
    const supply = this.toolMode === "soap" ? this.soap : this.water;
    if (supply <= 2) return { ok: false, code: "supply-empty", message: `${this.toolMode === "soap" ? "Soap" : "Water pressure"} is recovering.` };
    const elapsedMs = clamp(Number(deltaMs) || 0, 1, 250);
    const elapsedSeconds = elapsedMs / 1000;
    const effectScale = elapsedMs / 180;
    const cells = this.affectedCells(row, col);
    let changed = 0;
    let resisted = 0;
    if (this.toolMode === "soap") {
      for (const index of cells) if (this.resistant.has(index) && !this.soaped.has(index)) { this.soaped.add(index); changed += 1; }
      this.soap = clamp(this.soap - POWERWASH_SOAP_TOOL.drain * elapsedSeconds, 0, 100);
    } else {
      const nozzle = POWERWASH_NOZZLES[this.nozzle];
      const strength = clamp(this.level.cleanStrength * nozzle.power, 0.18, 1) * effectScale;
      for (const index of cells) {
        if (this.normal.has(index)) {
          const remaining = Number((this.normal.get(index) - strength).toFixed(3));
          if (remaining <= 0) this.normal.delete(index); else this.normal.set(index, remaining);
          changed += 1;
        }
        if (this.resistant.has(index)) {
          if (!this.soaped.has(index)) resisted += 1;
          else { this.resistant.delete(index); this.soaped.delete(index); changed += 1; }
        }
      }
      this.water = clamp(this.water - nozzle.drain * this.level.drainMult * elapsedSeconds, 0, 100);
    }
    if (resisted && !changed) this.soapWarnings += 1;
    this.strokes += 1;
    const rawPercent = this.rawPercent();
    if (rawPercent >= POWERWASH_MINIMUM_CLEAN_PERCENT) this.finish(rawPercent);
    return { ok: true, code: this.won ? "level-cleared" : resisted && !changed ? "soap-first" : changed ? "sprayed" : "already-clean", changed, resisted, state: this.snapshot() };
  }

  spraySegment(fromRow, fromCol, toRow, toCol, { deltaMs = 180 } = {}) {
    const start = { row: clamp(Number(fromRow), 0, POWERWASH_GRID.rows - 1), col: clamp(Number(fromCol), 0, POWERWASH_GRID.columns - 1) };
    const end = { row: clamp(Number(toRow), 0, POWERWASH_GRID.rows - 1), col: clamp(Number(toCol), 0, POWERWASH_GRID.columns - 1) };
    const steps = Math.max(1, Math.ceil(Math.hypot(end.row - start.row, end.col - start.col) / 0.72));
    const strokeBefore = this.strokes;
    let changed = 0;
    let resisted = 0;
    let last = null;
    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      const row = start.row + (end.row - start.row) * progress;
      const col = start.col + (end.col - start.col) * progress;
      const result = this.sprayAt(row, col, { deltaMs: Math.max(1, Number(deltaMs) / (steps + 1)) });
      if (!result.ok) {
        if (index === 0) return result;
        break;
      }
      changed += result.changed;
      resisted += result.resisted;
      last = result;
      if (this.won) break;
    }
    this.strokes = strokeBefore + 1;
    return {
      ok: true,
      code: this.won ? "level-cleared" : resisted && !changed ? "soap-first" : changed ? "sprayed" : last?.code || "already-clean",
      changed,
      resisted,
      samples: steps + 1,
      state: this.snapshot(),
    };
  }

  recover(deltaMs) {
    if (this.won) return { ok: false, code: "level-complete", changed: false, state: this.snapshot() };
    const elapsedSeconds = clamp(Number(deltaMs) || 0, 0, 2000) / 1000;
    const previousWater = this.water;
    const previousSoap = this.soap;
    this.water = clamp(this.water + this.level.regen * elapsedSeconds, 0, 100);
    this.soap = clamp(this.soap + this.level.regen * 0.72 * elapsedSeconds, 0, 100);
    const changed = this.water !== previousWater || this.soap !== previousSoap;
    return { ok: true, code: changed ? "supplies-recovered" : "supplies-full", changed, state: this.snapshot() };
  }

  rawPercent() {
    const remaining = new Set([...this.normal.keys(), ...this.resistant]).size;
    return clamp(Math.round(100 * (1 - remaining / Math.max(1, this.level.initialDirtyCells))), 0, 100);
  }

  finish(rawPercent = this.rawPercent()) {
    if (rawPercent < POWERWASH_MINIMUM_CLEAN_PERCENT) return false;
    this.rawPercentAtCompletion = rawPercent;
    this.normal.clear();
    this.resistant.clear();
    this.soaped.clear();
    this.won = true;
    return true;
  }

  forceClean() {
    this.finish(100);
    return this.snapshot();
  }

  snapshot() {
    const rawPercent = this.won ? this.rawPercentAtCompletion : this.rawPercent();
    return {
      level: this.level.level,
      normal: [...this.normal.entries()],
      resistant: [...this.resistant],
      soaped: [...this.soaped],
      water: Number(this.water.toFixed(2)),
      soap: Number(this.soap.toFixed(2)),
      toolMode: this.toolMode,
      nozzle: this.nozzle,
      strokes: this.strokes,
      soapWarnings: this.soapWarnings,
      rawPercent,
      percent: this.won ? 100 : rawPercent,
      remainingDirtyCells: new Set([...this.normal.keys(), ...this.resistant]).size,
      initialDirtyCells: this.level.initialDirtyCells,
      resistantRemaining: this.resistant.size,
      soapedSamples: this.soaped.size,
      won: this.won,
      rawPercentAtCompletion: this.rawPercentAtCompletion,
      projectedReward: calculatePowerwashNativeReward(this.level.level),
    };
  }
}

export function calculatePowerwashNativeReward(levelValue) {
  const level = clampLevel(levelValue);
  return Math.max(0, Math.min(POWERWASH_REWARD_CAP, Math.round(100 + level * (20 / 24))));
}

export function powerwashLevelSummary(levelValue) {
  const level = generatePowerwashLevel(levelValue);
  return {
    level: level.level,
    grimeCells: level.initialDirtyCells,
    resistantCells: level.resistant.length,
    resistantStains: level.resistantStainCount,
    cleanStrength: Number(level.cleanStrength.toFixed(3)),
    baseRadius: level.baseRadius,
    reward: calculatePowerwashNativeReward(level.level),
  };
}

export function validatePowerwashCatalogue() {
  const issues = [];
  const fingerprints = new Set();
  for (let level = 1; level <= POWERWASH_TOTAL_LEVELS; level += 1) {
    const generated = generatePowerwashLevel(level);
    fingerprints.add(generated.fingerprint);
    if (!generated.initialDirtyCells || !generated.resistant.length) issues.push(`Power Wash Level ${level} has no grime.`);
    if (generated.resistantStainCount < 5 || generated.resistantStainCount > 10) issues.push(`Power Wash Level ${level} has invalid resistant stains.`);
    if (issues.length > 20) break;
  }
  return { ok: issues.length === 0, issues, levels: POWERWASH_TOTAL_LEVELS, uniqueLevels: fingerprints.size, version: POWERWASH_BUILD_VERSION, visualRevision: POWERWASH_VISUAL_REVISION };
}
