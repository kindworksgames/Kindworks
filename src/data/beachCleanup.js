export const BEACH_BUILD_VERSION = "1.0.0-kindworks-integrated";
export const BEACH_TOTAL_LEVELS = 750;
export const BEACH_REWARD_CAP = 170;
export const BEACH_SOURCE_SHA256 = "0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5";
export const BEACH_PAYLOAD_SHA256 = "a933de6e550e08a8aecd240b5f19ab9514b90e44bc73bec54c9ce725bbf478bd";
export const BEACH_RAKE_PATTERNS = Object.freeze(["h", "v", "ne", "nw", "se", "sw"]);

export const BEACH_TILE = Object.freeze({
  boardwalk: "#",
  sand: ".",
  rubbish: "R",
  umbrella: "U",
  chair: "C",
  tide: "T",
  player: "P",
});

export const BEACH_RUBBISH_ITEMS = Object.freeze([
  { icon: "🧦", name: "Sock", coins: 1 }, { icon: "🖊️", name: "Pen", coins: 2 },
  { icon: "🍴", name: "Fork", coins: 2 }, { icon: "🥤", name: "Cup", coins: 3 },
  { icon: "🧴", name: "Bottle", coins: 3 }, { icon: "🧢", name: "Cap", coins: 5 },
  { icon: "🧤", name: "Glove", coins: 6 }, { icon: "📦", name: "Box", coins: 8 },
  { icon: "🛎️", name: "Bell", coins: 10 }, { icon: "🕶️", name: "Sunglasses", coins: 12 },
  { icon: "🔑", name: "Key", coins: 15 }, { icon: "🧸", name: "Teddy", coins: 18 },
  { icon: "🎸", name: "Guitar", coins: 25 }, { icon: "📱", name: "Phone", coins: 30 },
  { icon: "🪙", name: "Gold Coin", coins: 40 }, { icon: "💍", name: "Ring", coins: 55 },
  { icon: "💎", name: "Gem", coins: 70 }, { icon: "👑", name: "Crown", coins: 85 },
  { icon: "🧰", name: "Treasure Chest", coins: 100 },
].map((item) => Object.freeze(item)));

const DIRECTIONS = Object.freeze({ U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] });
const DIRECTION_FROM_DELTA = new Map(Object.entries(DIRECTIONS).map(([key, value]) => [value.join(","), key]));

export function beachRakePattern(entryDirection, exitDirection) {
  if (!Object.hasOwn(DIRECTIONS, exitDirection)) return null;
  if (!Object.hasOwn(DIRECTIONS, entryDirection)) return ["L", "R"].includes(exitDirection) ? "h" : "v";
  if (["L", "R"].includes(entryDirection) === ["L", "R"].includes(exitDirection)) return ["L", "R"].includes(exitDirection) ? "h" : "v";
  const edges = new Set();
  if (entryDirection === "R") edges.add("w");
  else if (entryDirection === "L") edges.add("e");
  else if (entryDirection === "D") edges.add("n");
  else if (entryDirection === "U") edges.add("s");
  if (exitDirection === "R") edges.add("e");
  else if (exitDirection === "L") edges.add("w");
  else if (exitDirection === "D") edges.add("s");
  else if (exitDirection === "U") edges.add("n");
  if (edges.has("n") && edges.has("e")) return "ne";
  if (edges.has("n") && edges.has("w")) return "nw";
  if (edges.has("s") && edges.has("e")) return "se";
  if (edges.has("s") && edges.has("w")) return "sw";
  return ["L", "R"].includes(exitDirection) ? "h" : "v";
}

function clampLevel(value) {
  return Math.max(1, Math.min(BEACH_TOTAL_LEVELS, Math.floor(Number(value) || 1)));
}

function mulberry32(seed) {
  return () => {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function beachCellKey(row, col) {
  return `${row},${col}`;
}

export function beachDifficulty(levelValue) {
  const level = clampLevel(levelValue);
  const progress = (level - 1) / (BEACH_TOTAL_LEVELS - 1);
  const width = 7 + Math.floor(progress * 8);
  const height = 7 + Math.floor(progress * 6);
  const interior = (width - 2) * (height - 2);
  const maxObstacles = Math.max(1, Math.floor(interior * 0.14));
  let obstacleCount = Math.max(1, Math.min(maxObstacles, 1 + Math.floor(progress * 10)));
  if (level === 1) obstacleCount = 1;
  let umbrellas = Math.max(1, Math.floor(obstacleCount * 0.4));
  let chairs = Math.floor(obstacleCount * 0.3);
  let tides = Math.max(0, obstacleCount - umbrellas - chairs);
  if (level <= 3) { chairs = 0; tides = 0; umbrellas = Math.min(2, umbrellas); }
  else if (level <= 10) tides = Math.min(1, tides);
  const rubbish = Math.max(1, Math.min(50, 1 + Math.floor(progress * 49)));
  return { level, width, height, umbrellas, chairs, tides, rubbish };
}

function reachableSand(raw, start) {
  const height = raw.length;
  const width = raw[0].length;
  const blocked = new Set([BEACH_TILE.boardwalk, BEACH_TILE.umbrella, BEACH_TILE.chair, BEACH_TILE.tide]);
  const seen = new Set([beachCellKey(start[0], start[1])]);
  const queue = [start];
  while (queue.length) {
    const [row, col] = queue.pop();
    for (const [rowDelta, colDelta] of Object.values(DIRECTIONS)) {
      const nextRow = row + rowDelta;
      const nextCol = col + colDelta;
      const key = beachCellKey(nextRow, nextCol);
      if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width || seen.has(key) || blocked.has(raw[nextRow][nextCol])) continue;
      seen.add(key);
      queue.push([nextRow, nextCol]);
    }
  }
  let total = 0;
  for (let row = 1; row < height - 1; row += 1) for (let col = 1; col < width - 1; col += 1) if ([BEACH_TILE.sand, BEACH_TILE.rubbish].includes(raw[row][col])) total += 1;
  return [...seen].filter((key) => { const [row, col] = key.split(",").map(Number); return [BEACH_TILE.sand, BEACH_TILE.rubbish].includes(raw[row]?.[col]); }).length >= total;
}

export function generateBeachLevel(levelValue) {
  const difficulty = beachDifficulty(levelValue);
  const rng = mulberry32(difficulty.level * 2654435761 + 42069);
  const raw = Array.from({ length: difficulty.height }, (_row, row) => Array.from({ length: difficulty.width }, (_col, col) => row === 0 || row === difficulty.height - 1 || col === 0 || col === difficulty.width - 1 ? BEACH_TILE.boardwalk : BEACH_TILE.sand));
  const startRow = 1 + Math.floor(rng() * (difficulty.height - 2));
  raw[startRow][0] = BEACH_TILE.player;
  const interior = [];
  for (let row = 1; row < difficulty.height - 1; row += 1) for (let col = 1; col < difficulty.width - 1; col += 1) interior.push([row, col]);
  for (let index = interior.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [interior[index], interior[other]] = [interior[other], interior[index]]; }
  let cursor = 0;
  const place = (count, tile) => {
    let placed = 0;
    while (placed < count && cursor < interior.length) {
      const [row, col] = interior[cursor++];
      if (Math.abs(col - 1) + Math.abs(row - startRow) <= 1) continue;
      raw[row][col] = tile;
      placed += 1;
    }
  };
  place(difficulty.umbrellas, BEACH_TILE.umbrella);
  place(difficulty.chairs, BEACH_TILE.chair);
  place(difficulty.tides, BEACH_TILE.tide);
  if (!reachableSand(raw, [startRow, 0])) {
    outer: for (let row = 1; row < difficulty.height - 1; row += 1) for (let col = 1; col < difficulty.width - 1; col += 1) {
      if ([BEACH_TILE.umbrella, BEACH_TILE.chair, BEACH_TILE.tide].includes(raw[row][col])) {
        raw[row][col] = BEACH_TILE.sand;
        if (reachableSand(raw, [startRow, 0])) break outer;
      }
    }
  }
  const open = [];
  for (let row = 1; row < difficulty.height - 1; row += 1) for (let col = 1; col < difficulty.width - 1; col += 1) if (raw[row][col] === BEACH_TILE.sand) open.push([row, col]);
  for (let index = open.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [open[index], open[other]] = [open[other], open[index]]; }
  for (let index = 0; index < Math.min(difficulty.rubbish, open.length); index += 1) raw[open[index][0]][open[index][1]] = BEACH_TILE.rubbish;
  return Object.freeze({
    ...difficulty,
    rows: Object.freeze(raw.map((row) => row.join(""))),
    start: Object.freeze([startRow, 0]),
    totalSand: raw.flat().filter((tile) => [BEACH_TILE.sand, BEACH_TILE.rubbish].includes(tile)).length,
    totalRubbish: raw.flat().filter((tile) => tile === BEACH_TILE.rubbish).length,
  });
}

function itemForRubbish(level, row, col, rakedCount) {
  const seed = (col * 17 + row * 31 + (level - 1) * 13 + rakedCount * 7) >>> 0;
  const progress = (level - 1) / Math.max(1, BEACH_TOTAL_LEVELS - 1);
  const biased = Math.pow((seed % 1000) / 1000, 1 - progress * 0.55);
  return BEACH_RUBBISH_ITEMS[Math.min(BEACH_RUBBISH_ITEMS.length - 1, Math.floor(biased * BEACH_RUBBISH_ITEMS.length))];
}

function copyFrame(engine) {
  return {
    row: engine.row, col: engine.col, rakedCells: [...engine.rakedCells], collectedCells: [...engine.collectedCells],
    rakePatterns: { ...engine.rakePatterns }, entryDirection: engine.entryDirection,
    collectedItems: engine.collectedItems.map((item) => ({ ...item })), earnedCoins: engine.earnedCoins,
    moves: engine.moves, undoUsed: engine.undoUsed, steppedOnRaked: engine.steppedOnRaked,
  };
}

export class BeachCleanupEngine {
  constructor(levelValue, saved = null) {
    this.level = generateBeachLevel(levelValue);
    this.row = Number.isInteger(saved?.row) ? saved.row : this.level.start[0];
    this.col = Number.isInteger(saved?.col) ? saved.col : this.level.start[1];
    this.rakedCells = new Set(Array.isArray(saved?.rakedCells) ? saved.rakedCells : []);
    this.rakePatterns = Object.fromEntries(Object.entries(saved?.rakePatterns && typeof saved.rakePatterns === "object" ? saved.rakePatterns : {})
      .filter(([key, pattern]) => this.rakedCells.has(key) && BEACH_RAKE_PATTERNS.includes(pattern)));
    this.entryDirection = Object.hasOwn(DIRECTIONS, saved?.entryDirection) ? saved.entryDirection : null;
    this.collectedCells = new Set(Array.isArray(saved?.collectedCells) ? saved.collectedCells : []);
    this.collectedItems = Array.isArray(saved?.collectedItems) ? saved.collectedItems.map((item) => ({ ...item })) : [];
    this.earnedCoins = Math.max(0, Math.min(BEACH_REWARD_CAP, Math.floor(Number(saved?.earnedCoins) || 0)));
    this.moves = Math.max(0, Math.floor(Number(saved?.moves) || 0));
    this.undoUsed = Boolean(saved?.undoUsed);
    this.steppedOnRaked = Boolean(saved?.steppedOnRaked);
    this.challenges = { noUndo: Boolean(saved?.challenges?.noUndo), underMoves: Boolean(saved?.challenges?.underMoves), cleanSweep: Boolean(saved?.challenges?.cleanSweep) };
    this.history = (Array.isArray(saved?.undoStack) ? saved.undoStack : []).map((frame) => structuredClone(frame)).slice(-30);
    this.won = Boolean(saved?.won);
    this.bonusCoins = Math.max(0, Math.floor(Number(saved?.bonusCoins) || 0));
    this.moveLimit = Math.max(12, Math.ceil(this.level.totalSand * 1.35) + 4);
  }

  tileAt(row, col) { return this.level.rows[row]?.[col] ?? null; }
  passable(row, col) { return this.tileAt(row, col) !== null && ![BEACH_TILE.umbrella, BEACH_TILE.chair, BEACH_TILE.tide].includes(this.tileAt(row, col)); }

  move(direction, { batchId = null } = {}) {
    if (this.won) return { ok: false, code: "level-complete", message: "This beach is already clean." };
    const delta = DIRECTIONS[direction];
    if (!delta) return { ok: false, code: "invalid-direction", message: "Choose a valid walking direction." };
    const nextRow = this.row + delta[0];
    const nextCol = this.col + delta[1];
    if (!this.passable(nextRow, nextCol)) return { ok: false, code: "blocked", message: "An obstacle blocks that step." };
    const normalizedBatchId = typeof batchId === "string" && batchId ? batchId : null;
    if (!normalizedBatchId || this.history.at(-1)?.batchId !== normalizedBatchId) {
      this.history.push({ ...copyFrame(this), ...(normalizedBatchId ? { batchId: normalizedBatchId } : {}) });
      this.history = this.history.slice(-30);
    }
    const fromTile = this.tileAt(this.row, this.col);
    const fromKey = beachCellKey(this.row, this.col);
    if (this.rakedCells.has(beachCellKey(nextRow, nextCol))) this.steppedOnRaked = true;
    this.moves += 1;
    if ([BEACH_TILE.sand, BEACH_TILE.rubbish].includes(fromTile)) {
      this.rakePatterns[fromKey] = beachRakePattern(this.entryDirection, direction);
      if (!this.rakedCells.has(fromKey)) this.rakedCells.add(fromKey);
      if (fromTile === BEACH_TILE.rubbish && !this.collectedCells.has(fromKey)) {
        this.collectedCells.add(fromKey);
        const item = itemForRubbish(this.level.level, this.row, this.col, this.rakedCells.size);
        const coins = Math.min(item.coins, Math.max(0, BEACH_REWARD_CAP - this.earnedCoins));
        this.earnedCoins += coins;
        this.collectedItems.push({ ...item, coins, cell: fromKey });
      }
    }
    this.row = nextRow;
    this.col = nextCol;
    this.entryDirection = direction;
    if (this.rakedCells.size === this.level.totalSand && this.collectedCells.size === this.level.totalRubbish) this.finish();
    return { ok: true, code: this.won ? "level-cleared" : "step", state: this.snapshot() };
  }

  finish() {
    let bonus = 0;
    if (this.challenges.noUndo && !this.undoUsed) bonus += 25;
    if (this.challenges.underMoves && this.moves <= this.moveLimit) bonus += 40;
    if (this.challenges.cleanSweep && !this.steppedOnRaked) bonus += 35;
    this.bonusCoins = Math.min(bonus, Math.max(0, BEACH_REWARD_CAP - this.earnedCoins));
    this.earnedCoins += this.bonusCoins;
    this.won = true;
  }

  undo() {
    if (this.won || !this.history.length) return { ok: false, code: "nothing-to-undo", message: "There is no beach step to undo." };
    const frame = this.history.pop();
    const priorHistory = this.history;
    Object.assign(this, new BeachCleanupEngine(this.level.level, { ...frame, challenges: this.challenges, undoStack: priorHistory, undoUsed: true }));
    this.undoUsed = true;
    return { ok: true, code: "step-undone", state: this.snapshot() };
  }

  toggleChallenge(challenge) {
    if (!Object.hasOwn(this.challenges, challenge) || this.won) return { ok: false, code: "challenge-unavailable" };
    this.challenges[challenge] = !this.challenges[challenge];
    return { ok: true, code: "challenge-toggled", state: this.snapshot() };
  }

  hint() {
    const target = [...Array(this.level.height).keys()].flatMap((row) => [...Array(this.level.width).keys()].map((col) => [row, col]))
      .find(([row, col]) => [BEACH_TILE.sand, BEACH_TILE.rubbish].includes(this.tileAt(row, col)) && !this.rakedCells.has(beachCellKey(row, col)));
    if (!target) return null;
    const startKey = beachCellKey(this.row, this.col);
    const queue = [[this.row, this.col]];
    const previous = new Map([[startKey, null]]);
    while (queue.length) {
      const [row, col] = queue.shift();
      if (row === target[0] && col === target[1]) break;
      for (const [direction, [rowDelta, colDelta]] of Object.entries(DIRECTIONS)) {
        const next = [row + rowDelta, col + colDelta];
        const key = beachCellKey(next[0], next[1]);
        if (previous.has(key) || !this.passable(next[0], next[1])) continue;
        previous.set(key, { row, col, direction }); queue.push(next);
      }
    }
    let cursor = beachCellKey(target[0], target[1]);
    if (!previous.has(cursor)) return null;
    let step = null;
    while (previous.get(cursor)) { step = previous.get(cursor); const parent = beachCellKey(step.row, step.col); if (parent === startKey) return step.direction; cursor = parent; }
    for (const [direction, [rowDelta, colDelta]] of Object.entries(DIRECTIONS)) if (this.passable(this.row + rowDelta, this.col + colDelta)) return direction;
    return null;
  }

  snapshot() {
    return {
      level: this.level.level, row: this.row, col: this.col, rakedCells: [...this.rakedCells], collectedCells: [...this.collectedCells],
      rakePatterns: { ...this.rakePatterns }, entryDirection: this.entryDirection,
      collectedItems: this.collectedItems.map((item) => ({ ...item })), earnedCoins: this.earnedCoins, bonusCoins: this.bonusCoins,
      moves: this.moves, moveLimit: this.moveLimit, undoUsed: this.undoUsed, steppedOnRaked: this.steppedOnRaked,
      challenges: { ...this.challenges }, undoStack: this.history.map((frame) => structuredClone(frame)),
      rakedCount: this.rakedCells.size, totalSand: this.level.totalSand, collectedRubbish: this.collectedCells.size,
      totalRubbish: this.level.totalRubbish, percent: Math.round((this.rakedCells.size / this.level.totalSand) * 100), won: this.won,
    };
  }
}

export function beachCertifiedRoute(levelValue) {
  const level = generateBeachLevel(levelValue);
  const visited = new Set();
  const route = [];
  const visit = (row, col) => {
    visited.add(beachCellKey(row, col));
    for (const [direction, [rowDelta, colDelta]] of Object.entries(DIRECTIONS)) {
      const nextRow = row + rowDelta; const nextCol = col + colDelta; const key = beachCellKey(nextRow, nextCol);
      const tile = level.rows[nextRow]?.[nextCol];
      if (visited.has(key) || tile === undefined || [BEACH_TILE.umbrella, BEACH_TILE.chair, BEACH_TILE.tide].includes(tile)) continue;
      route.push(direction); visit(nextRow, nextCol); route.push(DIRECTION_FROM_DELTA.get(`${-rowDelta},${-colDelta}`));
    }
  };
  visit(level.start[0], level.start[1]);
  return route;
}

export function verifyBeachLevel(levelValue) {
  const engine = new BeachCleanupEngine(levelValue);
  const route = beachCertifiedRoute(levelValue);
  for (const direction of route) { const result = engine.move(direction); if (!result.ok && !engine.won) return { ok: false, level: engine.level.level, reason: result.message }; if (engine.won) break; }
  return { ok: engine.won, level: engine.level.level, moves: engine.moves, earnedCoins: engine.earnedCoins };
}

export function beachLevelSummary(levelValue) {
  const level = generateBeachLevel(levelValue);
  return { level: level.level, width: level.width, height: level.height, sand: level.totalSand, rubbish: level.totalRubbish, umbrellas: level.umbrellas, chairs: level.chairs, tides: level.tides, moveLimit: Math.max(12, Math.ceil(level.totalSand * 1.35) + 4) };
}

export function validateBeachCatalogue({ verifyLevels = false } = {}) {
  const issues = [];
  for (let level = 1; level <= BEACH_TOTAL_LEVELS; level += 1) {
    const generated = generateBeachLevel(level);
    if (generated.level !== level || !generated.totalSand || generated.totalRubbish !== beachDifficulty(level).rubbish) issues.push(`Beach Level ${level} is incomplete.`);
    if (verifyLevels && !verifyBeachLevel(level).ok) issues.push(`Beach Level ${level} has no certified clear.`);
    if (issues.length > 20) break;
  }
  return { ok: issues.length === 0, issues, levels: BEACH_TOTAL_LEVELS, version: BEACH_BUILD_VERSION };
}
