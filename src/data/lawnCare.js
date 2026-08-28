import {
  LAWN_CAMPAIGN_QA,
  LAWN_ENGINE_VERSION,
  LAWN_LEVELS,
  LAWN_PAYLOAD_SHA256,
  LAWN_SOURCE_SHA256,
  LAWN_TOTAL_LEVELS,
} from "./lawnCareData.js";

export {
  LAWN_CAMPAIGN_QA,
  LAWN_ENGINE_VERSION,
  LAWN_LEVELS,
  LAWN_PAYLOAD_SHA256,
  LAWN_SOURCE_SHA256,
  LAWN_TOTAL_LEVELS,
};

export const LAWN_STAR_THRESHOLDS = Object.freeze({ one: 50, two: 85 });
export const LAWN_UNDO_LIMIT = 5;
export const LAWN_CELL_TRAVEL_MS = 55;
export const LAWN_WEED_CLUSTER_MAX = 6;
export const LAWN_WEED_TYPES = Object.freeze({ tough: "tough", woody: "woody" });
export const LAWN_MOWER_PROFILES = Object.freeze({
  "starter-mower": Object.freeze({ tough: 1.15, woody: 1.95, label: "Old Green Mower", color: "#df5b52" }),
  "cherry-compact-mower": Object.freeze({ tough: 0.95, woody: 1.60, label: "Cherry Red Compact", color: "#b94e45" }),
  "classic-yellow-mower": Object.freeze({ tough: 0.75, woody: 1.25, label: "Classic Yellow", color: "#d4a832" }),
  "swiftcut-mower": Object.freeze({ tough: 0.55, woody: 0.95, label: "SwiftCut", color: "#3f7f98" }),
  "meadow-pro-mower": Object.freeze({ tough: 0.35, woody: 0.65, label: "Meadow Pro", color: "#684f93" }),
  "vintage-special-mower": Object.freeze({ tough: 0.20, woody: 0.35, label: "Vintage Special", color: "#a8673e" }),
});

const DIRECTIONS = Object.freeze({ U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] });
const DIRECTION_SET = new Set(Object.keys(DIRECTIONS));
const LEVEL_CACHE = new Map();

export function lawnCellKey(row, col) {
  return `${row},${col}`;
}

function hashString(input) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let value = seed >>> 0 || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [list[index], list[other]] = [list[other], list[index]];
  }
  return list;
}

function orthogonalNeighbours(level, row, col) {
  const neighbours = [];
  for (const [rowDelta, colDelta] of Object.values(DIRECTIONS)) {
    const nextRow = row + rowDelta;
    const nextCol = col + colDelta;
    if (nextRow < 0 || nextRow >= level.height || nextCol < 0 || nextCol >= level.width) continue;
    if ([".", "S"].includes(level.rows[nextRow][nextCol])) neighbours.push([nextRow, nextCol]);
  }
  return neighbours;
}

export function lawnWeedTargets(levelNumber, openCount) {
  if (levelNumber < 10) return { tough: 0, woody: 0 };
  const lateProgress = Math.max(0, (levelNumber - 10) / 740);
  let tough = Math.round(openCount * (0.07 + lateProgress * 0.16));
  if (levelNumber < 25) tough = Math.min(tough, 2);
  else if (levelNumber < 50) tough = Math.min(tough, 4);
  else if (levelNumber < 100) tough = Math.min(tough, 6);
  else if (levelNumber < 250) tough = Math.min(tough, 8);
  let woody = 0;
  if (levelNumber >= 50) {
    const woodyProgress = (levelNumber - 50) / 700;
    woody = Math.round(openCount * (0.03 + Math.max(0, woodyProgress) * 0.11));
    if (levelNumber < 100) woody = Math.min(woody, 2);
    else if (levelNumber < 250) woody = Math.min(woody, 4);
    else if (levelNumber < 500) woody = Math.min(woody, 6);
    woody = Math.max(1, woody);
  }
  tough = Math.max(1, tough);
  if (tough + woody > Math.max(1, openCount - 1)) {
    const overshoot = tough + woody - (openCount - 1);
    woody = Math.max(0, woody - overshoot);
    if (tough + woody > openCount - 1) tough = Math.max(1, openCount - 1 - woody);
  }
  return { tough, woody };
}

function placeWeedClusters(level, available, target, rng, taken, blocked) {
  const assigned = [];
  if (target <= 0 || !available.length) return assigned;
  const allowed = new Set(available.map(([row, col]) => lawnCellKey(row, col)));
  let safety = 0;
  while (assigned.length < target && safety++ < 500) {
    const seeds = shuffle(available.filter(([row, col]) => {
      const cell = lawnCellKey(row, col);
      return !taken.has(cell) && !blocked.has(cell);
    }), rng);
    if (!seeds.length) break;
    const seed = seeds[0];
    const cluster = [seed];
    const clusterKeys = new Set([lawnCellKey(seed[0], seed[1])]);
    const desired = Math.min(LAWN_WEED_CLUSTER_MAX, target - assigned.length, 2 + Math.floor(rng() * 4));
    const frontier = [seed];
    while (cluster.length < desired && frontier.length) {
      shuffle(frontier, rng);
      let added = null;
      for (const [frontierRow, frontierCol] of frontier) {
        const candidates = shuffle(orthogonalNeighbours(level, frontierRow, frontierCol).filter(([row, col]) => {
          const cell = lawnCellKey(row, col);
          return allowed.has(cell) && !taken.has(cell) && !blocked.has(cell) && !clusterKeys.has(cell);
        }), rng);
        if (candidates.length) {
          [added] = candidates;
          break;
        }
      }
      if (!added) break;
      const cell = lawnCellKey(added[0], added[1]);
      cluster.push(added);
      clusterKeys.add(cell);
      frontier.push(added);
    }
    for (const [row, col] of cluster) {
      taken.add(lawnCellKey(row, col));
      assigned.push([row, col]);
    }
    for (const [row, col] of cluster) {
      for (const [nextRow, nextCol] of orthogonalNeighbours(level, row, col)) {
        const next = lawnCellKey(nextRow, nextCol);
        if (!clusterKeys.has(next)) blocked.add(next);
      }
    }
  }
  return assigned;
}

function generateWeeds(level) {
  const weeds = new Map();
  const targets = lawnWeedTargets(level.id, level.openCells.length);
  if (!targets.tough && !targets.woody) return { weeds, counts: { tough: 0, woody: 0 } };
  const rng = makeRng(hashString(`${level.id}|${level.releaseChecksum}|${level.id}|weed-v58`));
  const start = lawnCellKey(level.start[0], level.start[1]);
  const available = level.openCells.filter(([row, col]) => lawnCellKey(row, col) !== start);
  const taken = new Set();
  const blocked = new Set();
  const woody = placeWeedClusters(level, available, targets.woody, rng, taken, blocked);
  for (const [row, col] of woody) weeds.set(lawnCellKey(row, col), LAWN_WEED_TYPES.woody);
  const tough = placeWeedClusters(level, available, targets.tough, rng, taken, blocked);
  for (const [row, col] of tough) weeds.set(lawnCellKey(row, col), LAWN_WEED_TYPES.tough);
  const fillSingletons = (type, needed) => {
    const candidates = shuffle(available.filter(([row, col]) => {
      const cell = lawnCellKey(row, col);
      return !taken.has(cell) && !blocked.has(cell);
    }), rng);
    let added = 0;
    for (const [row, col] of candidates) {
      if (added >= needed) break;
      const cell = lawnCellKey(row, col);
      taken.add(cell);
      weeds.set(cell, type);
      added += 1;
      for (const [nextRow, nextCol] of orthogonalNeighbours(level, row, col)) blocked.add(lawnCellKey(nextRow, nextCol));
    }
    return added;
  };
  if (level.id >= 50 && woody.length < 1) fillSingletons(LAWN_WEED_TYPES.woody, 1 - woody.length);
  if (level.id >= 10 && tough.length < 1) fillSingletons(LAWN_WEED_TYPES.tough, 1 - tough.length);
  return {
    weeds,
    counts: {
      tough: [...weeds.values()].filter((type) => type === LAWN_WEED_TYPES.tough).length,
      woody: [...weeds.values()].filter((type) => type === LAWN_WEED_TYPES.woody).length,
    },
  };
}

function prepareLevel(definition) {
  const height = definition.rows.length;
  const width = definition.rows[0].length;
  const openCells = [];
  const indexByCell = new Map();
  let start = null;
  for (let row = 0; row < height; row += 1) {
    if (definition.rows[row].length !== width) throw new Error(`${definition.name} has uneven rows.`);
    for (let col = 0; col < width; col += 1) {
      const symbol = definition.rows[row][col];
      if (!["#", ".", "S"].includes(symbol)) throw new Error(`${definition.name} has an unsupported cell.`);
      if (symbol === "." || symbol === "S") {
        indexByCell.set(lawnCellKey(row, col), openCells.length);
        openCells.push([row, col]);
      }
      if (symbol === "S") start = [row, col];
    }
  }
  if (!start) throw new Error(`${definition.name} has no mower start.`);
  const moves = new Map();
  for (const [row, col] of openCells) {
    for (const [direction, [rowDelta, colDelta]] of Object.entries(DIRECTIONS)) {
      let nextRow = row;
      let nextCol = col;
      let mask = 0n;
      const crossed = [];
      while (true) {
        const candidateRow = nextRow + rowDelta;
        const candidateCol = nextCol + colDelta;
        if (candidateRow < 0 || candidateRow >= height || candidateCol < 0 || candidateCol >= width || definition.rows[candidateRow][candidateCol] === "#") break;
        nextRow = candidateRow;
        nextCol = candidateCol;
        crossed.push([nextRow, nextCol]);
        mask |= 1n << BigInt(indexByCell.get(lawnCellKey(nextRow, nextCol)));
      }
      if (crossed.length) moves.set(`${row},${col},${direction}`, { row: nextRow, col: nextCol, crossed, mask });
    }
  }
  const level = {
    ...definition,
    width,
    height,
    openCells,
    indexByCell,
    start,
    moves,
    canonicalSolution: [...definition.solution],
    allCutMask: (1n << BigInt(openCells.length)) - 1n,
  };
  const weedLayout = generateWeeds(level);
  level.weeds = weedLayout.weeds;
  level.weedCounts = weedLayout.counts;
  return level;
}

export function getLawnLevel(levelValue) {
  const level = Math.floor(Number(levelValue));
  if (!Number.isInteger(level) || level < 1 || level > LAWN_TOTAL_LEVELS) throw new RangeError("Lawn Care level must be from 1 to 750.");
  if (!LEVEL_CACHE.has(level)) LEVEL_CACHE.set(level, prepareLevel(LAWN_LEVELS[level - 1]));
  return LEVEL_CACHE.get(level);
}

export function lawnStars(percentValue) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(percentValue) || 0)));
  if (percent >= 100) return 3;
  if (percent >= LAWN_STAR_THRESHOLDS.two) return 2;
  if (percent >= LAWN_STAR_THRESHOLDS.one) return 1;
  return 0;
}

function cellsFromMask(level, mask) {
  return level.openCells.filter(([row, col]) => {
    const index = level.indexByCell.get(lawnCellKey(row, col));
    return (mask & (1n << BigInt(index))) !== 0n;
  }).map(([row, col]) => lawnCellKey(row, col));
}

function maskFromCells(level, cells) {
  let mask = 0n;
  for (const cell of cells || []) {
    const index = level.indexByCell.get(String(cell));
    if (index !== undefined) mask |= 1n << BigInt(index);
  }
  return mask;
}

function snapshotFrame(engine) {
  return {
    row: engine.row,
    col: engine.col,
    facing: engine.facing,
    cutCells: cellsFromMask(engine.level, engine.cutMask),
    cutDirections: { ...engine.cutDirections },
    moves: engine.moves,
  };
}

function validFrame(level, frame) {
  if (!frame || !level.indexByCell.has(lawnCellKey(frame.row, frame.col))) return null;
  const validCells = new Set(cellsFromMask(level, maskFromCells(level, frame.cutCells)));
  return {
    row: Number(frame.row),
    col: Number(frame.col),
    facing: DIRECTION_SET.has(frame.facing) ? frame.facing : "U",
    cutCells: [...validCells],
    cutDirections: Object.fromEntries(Object.entries(frame.cutDirections && typeof frame.cutDirections === "object" ? frame.cutDirections : {})
      .filter(([cell, direction]) => validCells.has(cell) && DIRECTION_SET.has(direction))),
    moves: Math.max(0, Math.min(level.canonicalSolution.length + 2, Math.floor(Number(frame.moves) || 0))),
  };
}

export function findLawnRoute(levelValue, { row, col, cutCells = [] } = {}, maxStates = 250000) {
  const level = getLawnLevel(levelValue);
  const startRow = level.indexByCell.has(lawnCellKey(row, col)) ? Number(row) : level.start[0];
  const startCol = level.indexByCell.has(lawnCellKey(row, col)) ? Number(col) : level.start[1];
  let startMask = maskFromCells(level, cutCells);
  startMask |= 1n << BigInt(level.indexByCell.get(lawnCellKey(startRow, startCol)));
  const queue = [{ row: startRow, col: startCol, mask: startMask, path: [] }];
  const seen = new Set([`${startRow},${startCol}|${startMask.toString(16)}`]);
  for (let cursor = 0; cursor < queue.length && cursor < maxStates; cursor += 1) {
    const node = queue[cursor];
    if (node.mask === level.allCutMask) return { status: "solved", path: node.path, states: cursor + 1 };
    for (const direction of Object.keys(DIRECTIONS)) {
      const move = level.moves.get(`${node.row},${node.col},${direction}`);
      if (!move) continue;
      const mask = node.mask | move.mask;
      const stateKey = `${move.row},${move.col}|${mask.toString(16)}`;
      if (seen.has(stateKey)) continue;
      seen.add(stateKey);
      queue.push({ row: move.row, col: move.col, mask, path: [...node.path, direction] });
    }
  }
  return { status: queue.length >= maxStates ? "limit" : "unsolvable", path: [], states: Math.min(queue.length, maxStates) };
}

export function lawnTravelPlan(levelValue, crossedCells, directionValue, mowerProfile = LAWN_MOWER_PROFILES["starter-mower"]) {
  const level = getLawnLevel(levelValue);
  const direction = DIRECTION_SET.has(directionValue) ? directionValue : "U";
  return (Array.isArray(crossedCells) ? crossedCells : []).map((cell) => {
    const weed = level.weeds.get(String(cell)) || null;
    const resistance = weed ? Math.max(0, Number(mowerProfile?.[weed]) || 0) : 0;
    return {
      cell: String(cell), direction, weed, resistance,
      durationMs: LAWN_CELL_TRAVEL_MS + Math.round(resistance * LAWN_CELL_TRAVEL_MS),
      strain: resistance >= 0.75,
    };
  });
}

export class LawnCareEngine {
  constructor(levelValue, snapshot = null) {
    this.level = getLawnLevel(levelValue);
    this.moveLimit = this.level.canonicalSolution.length + 2;
    const frame = validFrame(this.level, snapshot);
    this.row = frame?.row ?? this.level.start[0];
    this.col = frame?.col ?? this.level.start[1];
    this.facing = frame?.facing ?? "U";
    this.cutMask = frame ? maskFromCells(this.level, frame.cutCells) : 0n;
    this.cutMask |= 1n << BigInt(this.level.indexByCell.get(lawnCellKey(this.row, this.col)));
    this.cutDirections = { ...(frame?.cutDirections || {}) };
    this.moves = frame?.moves ?? 0;
    this.undoStack = (Array.isArray(snapshot?.undoStack) ? snapshot.undoStack : [])
      .map((entry) => validFrame(this.level, entry))
      .filter(Boolean)
      .slice(-LAWN_UNDO_LIMIT);
    this.won = this.cutMask === this.level.allCutMask;
    this.ended = this.won || this.moves >= this.moveLimit || snapshot?.status === "failed";
  }

  get cutCount() {
    return cellsFromMask(this.level, this.cutMask).length;
  }

  get percent() {
    return Math.round((this.cutCount / this.level.openCells.length) * 100);
  }

  get stars() {
    return lawnStars(this.percent);
  }

  move(directionValue, { checkRoute = true } = {}) {
    const direction = String(directionValue || "").toUpperCase();
    if (this.ended) return { ok: false, code: "attempt-ended", message: "Retry the lawn before making another move." };
    if (!DIRECTION_SET.has(direction)) return { ok: false, code: "invalid-direction", message: "Choose up, down, left or right." };
    const move = this.level.moves.get(`${this.row},${this.col},${direction}`);
    if (!move) return { ok: false, code: "blocked", message: "The mower cannot move that way." };
    this.undoStack.push(snapshotFrame(this));
    this.undoStack = this.undoStack.slice(-LAWN_UNDO_LIMIT);
    const beforeMask = this.cutMask;
    this.row = move.row;
    this.col = move.col;
    this.facing = direction;
    this.cutMask |= move.mask;
    for (const [row, col] of move.crossed) this.cutDirections[lawnCellKey(row, col)] = direction;
    this.moves += 1;
    this.won = this.cutMask === this.level.allCutMask;
    let endReason = this.moves >= this.moveLimit && !this.won ? "out-of-gas" : null;
    if (checkRoute && !this.won && !endReason) {
      const route = findLawnRoute(this.level.id, this.snapshot());
      if (route.status !== "solved" || route.path.length > this.moveLimit - this.moves) endReason = "dead-end";
    }
    this.ended = this.won || Boolean(endReason);
    const newlyCut = cellsFromMask(this.level, this.cutMask & ~beforeMask);
    return {
      ok: true,
      code: this.won ? "lawn-perfect" : endReason ? `lawn-${endReason}` : "lawn-moved",
      endReason,
      direction,
      crossed: move.crossed.map(([row, col]) => lawnCellKey(row, col)),
      newlyCut,
      state: this.snapshot(),
    };
  }

  undo() {
    if (this.ended) return { ok: false, code: "attempt-ended", message: "Retry the lawn to change this completed attempt." };
    const frame = this.undoStack.pop();
    if (!frame) return { ok: false, code: "nothing-to-undo", message: "There is no earlier mower move to restore." };
    this.row = frame.row;
    this.col = frame.col;
    this.facing = frame.facing;
    this.cutMask = maskFromCells(this.level, frame.cutCells);
    this.cutDirections = { ...(frame.cutDirections || {}) };
    this.moves = frame.moves;
    this.won = false;
    this.ended = false;
    return { ok: true, code: "lawn-undone", state: this.snapshot() };
  }

  hint(maxStates = 250000) {
    return findLawnRoute(this.level.id, this.snapshot(), maxStates);
  }

  snapshot() {
    return {
      level: this.level.id,
      row: this.row,
      col: this.col,
      facing: this.facing,
      cutCells: cellsFromMask(this.level, this.cutMask),
      cutDirections: { ...this.cutDirections },
      cutCount: this.cutCount,
      openCount: this.level.openCells.length,
      moves: this.moves,
      moveLimit: this.moveLimit,
      movesLeft: Math.max(0, this.moveLimit - this.moves),
      percent: this.percent,
      stars: this.stars,
      won: this.won,
      ended: this.ended,
      status: this.won ? "completed" : this.ended ? "failed" : "playing",
      undoStack: this.undoStack.map((entry) => ({ ...entry, cutCells: [...entry.cutCells] })),
    };
  }
}

export function verifyLawnSolution(levelValue) {
  const level = getLawnLevel(levelValue);
  const engine = new LawnCareEngine(level.id);
  for (const direction of level.canonicalSolution) {
    const moved = engine.move(direction, { checkRoute: false });
    if (!moved.ok) return { ok: false, level: level.id, reason: moved.message };
  }
  return {
    ok: engine.won && engine.moves === level.optimalMoves,
    level: level.id,
    moves: engine.moves,
    percent: engine.percent,
    stars: engine.stars,
    reason: engine.won ? null : "The stored route did not mow every grass cell.",
  };
}

export function lawnLevelSummary(levelValue) {
  const level = getLawnLevel(levelValue);
  return {
    level: level.id,
    name: level.name,
    difficulty: level.difficulty,
    width: level.width,
    height: level.height,
    openCount: level.openCells.length,
    optimalMoves: level.canonicalSolution.length,
    moveLimit: level.canonicalSolution.length + 2,
    toughWeeds: level.weedCounts.tough,
    woodyWeeds: level.weedCounts.woody,
    checkpoint: level.id === 1 || level.id % 50 === 0 || level.id === LAWN_TOTAL_LEVELS,
  };
}

export function validateLawnCatalogue({ verifySolutions = true } = {}) {
  const issues = [];
  const grids = new Set();
  const sourceIds = new Set();
  const sourceFamilies = new Set();
  let previousMoves = 0;
  let maxWeedComponent = 0;
  for (let levelNumber = 1; levelNumber <= LAWN_TOTAL_LEVELS; levelNumber += 1) {
    const level = getLawnLevel(levelNumber);
    const grid = level.rows.join("\n");
    if (grids.has(grid)) issues.push(`Level ${levelNumber} duplicates an earlier lawn.`);
    grids.add(grid);
    sourceIds.add(level.qa?.sourceLevelId);
    sourceFamilies.add(level.qa?.sourceFamilyId);
    if (level.canonicalSolution.length < previousMoves) issues.push(`Level ${levelNumber} optimal moves regress.`);
    previousMoves = level.canonicalSolution.length;
    if (levelNumber > 1) {
      const difference = Number(level.qa?.differenceFromPrevious);
      if (difference < 0.30 || difference > 0.60) issues.push(`Level ${levelNumber} structural difference is invalid.`);
    }
    if (levelNumber < 10 && level.weedCounts.tough + level.weedCounts.woody !== 0) issues.push(`Level ${levelNumber} introduces weeds early.`);
    if (levelNumber >= 10 && level.weedCounts.tough < 1) issues.push(`Level ${levelNumber} is missing tough weeds.`);
    if (levelNumber < 50 && level.weedCounts.woody !== 0) issues.push(`Level ${levelNumber} introduces woody weeds early.`);
    if (levelNumber >= 50 && level.weedCounts.woody < 1) issues.push(`Level ${levelNumber} is missing woody weeds.`);
    const remaining = new Set(level.weeds.keys());
    while (remaining.size) {
      const first = remaining.values().next().value;
      remaining.delete(first);
      const queue = [first];
      let count = 0;
      while (queue.length) {
        const cell = queue.shift();
        count += 1;
        const [row, col] = cell.split(",").map(Number);
        for (const [nextRow, nextCol] of orthogonalNeighbours(level, row, col)) {
          const next = lawnCellKey(nextRow, nextCol);
          if (remaining.delete(next)) queue.push(next);
        }
      }
      maxWeedComponent = Math.max(maxWeedComponent, count);
      if (count > LAWN_WEED_CLUSTER_MAX) issues.push(`Level ${levelNumber} has an oversized weed cluster.`);
    }
    if (verifySolutions) {
      const verification = verifyLawnSolution(levelNumber);
      if (!verification.ok) issues.push(`Level ${levelNumber}: ${verification.reason}`);
    }
  }
  if (sourceIds.size !== LAWN_TOTAL_LEVELS) issues.push("Lawn source IDs are not unique.");
  if (sourceFamilies.size !== LAWN_TOTAL_LEVELS) issues.push("Lawn source families are not unique.");
  return {
    ok: issues.length === 0,
    issues,
    levels: LAWN_TOTAL_LEVELS,
    uniqueGrids: grids.size,
    sourceIds: sourceIds.size,
    sourceFamilies: sourceFamilies.size,
    maxWeedComponent,
    engineVersion: LAWN_ENGINE_VERSION,
    sourceHash: LAWN_SOURCE_SHA256,
    payloadHash: LAWN_PAYLOAD_SHA256,
  };
}
