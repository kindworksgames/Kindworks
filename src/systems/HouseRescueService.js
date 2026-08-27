import { HOUSES } from "../data/town.js";
import {
  HOUSE_RESCUE_CATEGORIES,
  HOUSE_RESCUE_RULES,
  HOUSE_RESCUE_TOTAL_LEVELS,
  generateHouseRescueDirt,
  generateHouseRescueItems,
  houseRescueCoverage,
  houseRescueLevel,
  houseRescueReward,
  houseRescueStars,
  validateHouseRescueCatalogue,
} from "../data/houseRescue.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { ITEM_CATALOG } from "../data/items.js";
import { queueHomeownerGiftInto } from "./HomeownerGiftService.js";
import {
  buildHouseRescueGeometry,
  constrainHouseRescueVacuum,
  houseRescueVacuumStart,
} from "../data/houseRescueGeometry.js";

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

function seededDelay(houseId, jobSerial) {
  let hash = 2166136261;
  for (const character of `${houseId}:${jobSerial}:rescue-respawn`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return HOUSE_RESCUE_RULES.respawnMinDays + ((hash >>> 0) % (HOUSE_RESCUE_RULES.respawnMaxDays - HOUSE_RESCUE_RULES.respawnMinDays + 1));
}

function validPosition(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? { x: Number(position.x), y: Number(position.y) }
    : null;
}

export class HouseRescueService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.listeners = new Set();
    this.catalogueValidation = validateHouseRescueCatalogue();
    this.lastResult = null;
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A House Rescue listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().houseRescue); }
  getActiveSession() { return this.getSnapshot().active; }
  getLastResult() { return this.lastResult ? structuredClone(this.lastResult) : null; }
  getGeometry(houseId = this.getActiveSession()?.houseId) { return structuredClone(buildHouseRescueGeometry(houseId)); }

  getVacuumLoadout(stateOverride = null) {
    const state = stateOverride || this.gameState.getSnapshot();
    const itemId = state.inventory?.equipped?.vacuum || "starter-vacuum";
    const item = ITEM_CATALOG[itemId]?.slot === "vacuum" ? ITEM_CATALOG[itemId] : ITEM_CATALOG["starter-vacuum"];
    return {
      itemId: item.id,
      name: item.name,
      icon: item.icon,
      power: Number(item.effect?.vacuumPower) || HOUSE_RESCUE_RULES.vacuumPower,
      radius: (Number(item.effect?.vacuumRadius) || 36) / 5,
      speedMultiplier: Number(item.effect?.vacuumSpeedMultiplier) || 1,
      color: item.effect?.vacuumColor || "#d56155",
    };
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors, message: replaced.errors.join(" ") };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "House Rescue could not be saved, so the action was safely rolled back.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  refreshJobs() {
    const current = this.getSnapshot();
    const worldDay = this.gameState.getSnapshot().world.day;
    const due = Object.values(current.homes)
      .filter((home) => !home.dirty && home.nextDirtyDay > 0 && home.nextDirtyDay <= worldDay)
      .sort((a, b) => a.nextDirtyDay - b.nextDirtyDay || Number(a.houseId.split("-")[1]) - Number(b.houseId.split("-")[1]));
    const available = HOUSE_RESCUE_RULES.maxDirtyHomes - Object.values(current.homes).filter((home) => home.dirty).length;
    if (!due.length || available <= 0) return { ok: true, code: "house-rescue-jobs-current", changed: false };
    return this.commit((state) => {
      for (const home of due.slice(0, available)) {
        state.houseRescue.homes[home.houseId].dirty = true;
        state.houseRescue.homes[home.houseId].jobSerial += 1;
        state.houseRescue.homes[home.houseId].nextDirtyDay = 0;
      }
      return { ok: true, code: "house-rescue-jobs-refreshed", changed: true };
    });
  }

  dirtyHomes() {
    return Object.values(this.getSnapshot().homes).filter((home) => home.dirty).map((home) => structuredClone(home));
  }

  startLevel(level = 1, { houseId, returnPosition, returnFacing = "down" } = {}) {
    const requested = Math.floor(Number(level));
    if (!Number.isInteger(requested) || requested < 1 || requested > HOUSE_RESCUE_TOTAL_LEVELS) return { ok: false, code: "invalid-level", message: "Choose a House Rescue level from 1 to 750." };
    const snapshot = this.getSnapshot();
    if (requested > snapshot.unlockedLevel) return { ok: false, code: "level-locked", message: `Complete Level ${snapshot.unlockedLevel} to unlock this House Rescue level.` };
    if (!HOUSES.some((house) => house.id === houseId) || !snapshot.homes[houseId]?.dirty) return { ok: false, code: "home-clean", message: "This home does not currently need a House Rescue." };
    if (snapshot.active) {
      if (snapshot.active.houseId === houseId && snapshot.active.level === requested) return { ok: true, code: "house-rescue-resumed", session: snapshot.active };
      return { ok: false, code: "rescue-active", message: "Finish or resume the current House Rescue before starting another home." };
    }
    this.lastResult = null;
    return this.commit((state) => {
      const home = state.houseRescue.homes[houseId];
      state.houseRescue.selectedLevel = requested;
      state.houseRescue.attempts += 1;
      state.houseRescue.active = {
        format: 1,
        id: `house-rescue-${houseId}-${home.jobSerial}-level-${requested}`,
        houseId,
        jobSerial: home.jobSerial,
        level: requested,
        phase: "sorting",
        score: 0,
        mistakes: 0,
        correct: 0,
        items: generateHouseRescueItems({ houseId, jobSerial: home.jobSerial, level: requested }).map((item) => ({ ...item })),
        dirt: generateHouseRescueDirt({ houseId, jobSerial: home.jobSerial, level: requested }).map((stain) => ({ ...stain })),
        vacuum: houseRescueVacuumStart(buildHouseRescueGeometry(houseId)),
        vacuumContacts: [],
        returnPosition: validPosition(returnPosition),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
        startedAt: this.now(),
      };
      return { ok: true, code: "house-rescue-started", session: structuredClone(state.houseRescue.active) };
    });
  }

  sortItem(itemId, category) {
    if (!HOUSE_RESCUE_CATEGORIES[category]) return { ok: false, code: "invalid-category", message: "Choose Organic, Recycling or Garbage." };
    return this.commit((state) => {
      const session = state.houseRescue.active;
      if (!session || session.phase !== "sorting") return { ok: false, code: "sorting-unavailable", message: "Start or resume the sorting stage first." };
      const currentWave = Math.floor((session.items.find((item) => !item.sorted)?.wave) ?? 0);
      const item = session.items.find((entry) => entry.id === itemId && !entry.sorted && entry.wave === currentWave);
      if (!item) return { ok: false, code: "item-unavailable", message: "That rubbish item is not in the current wave." };
      const correct = item.category === category;
      if (correct) {
        item.sorted = true;
        session.correct += 1;
        session.score += HOUSE_RESCUE_RULES.correctScore;
        state.houseRescue.lifetimeItemsSorted += 1;
        if (session.correct === session.items.length) session.phase = "vacuum";
      } else {
        session.mistakes += 1;
        session.score += HOUSE_RESCUE_RULES.wrongScore;
      }
      return { ok: true, code: correct ? "house-rescue-item-sorted" : "house-rescue-sort-mistake", correct, itemId, category, session: structuredClone(session) };
    });
  }

  moveVacuum(x, y) {
    return this.commit((state) => {
      const session = state.houseRescue.active;
      if (!session || session.phase !== "vacuum") return { ok: false, code: "vacuum-unavailable", message: "Sort every rubbish item before vacuuming." };
      const loadout = this.getVacuumLoadout(state);
      const from = { ...session.vacuum };
      const geometry = buildHouseRescueGeometry(session.houseId);
      const target = constrainHouseRescueVacuum(geometry, from, { x, y });
      const targetX = target.x;
      const targetY = target.y;
      const distance = Math.hypot(targetX - from.x, targetY - from.y);
      const steps = Math.max(1, Math.ceil(distance / 1.5));
      const contacted = new Set();
      for (let step = 0; step <= steps; step += 1) {
        const fraction = step / steps;
        const px = from.x + (targetX - from.x) * fraction;
        const py = from.y + (targetY - from.y) * fraction;
        for (const stain of session.dirt) if (stain.remaining > 0 && Math.hypot(stain.x - px, stain.y - py) <= loadout.radius) contacted.add(stain.id);
      }
      const previous = new Set(session.vacuumContacts || []);
      let cleanedLayers = 0;
      for (const id of contacted) {
        if (previous.has(id)) continue;
        const stain = session.dirt.find((entry) => entry.id === id);
        if (!stain || stain.remaining <= 0) continue;
        const before = stain.remaining;
        stain.remaining = Math.max(0, stain.remaining - loadout.power);
        cleanedLayers += before - stain.remaining;
      }
      session.vacuum = { x: targetX, y: targetY };
      session.vacuumContacts = session.dirt.filter((stain) => stain.remaining > 0 && Math.hypot(stain.x - targetX, stain.y - targetY) <= loadout.radius).map((stain) => stain.id);
      state.houseRescue.lifetimeStainLayers += cleanedLayers;
      const coverage = houseRescueCoverage(session.dirt);
      if (coverage >= HOUSE_RESCUE_RULES.completionCoverage) return this.completeMutation(state, session, coverage, cleanedLayers);
      return { ok: true, code: "house-rescue-vacuum-moved", cleanedLayers, coverage, loadout, session: structuredClone(session) };
    });
  }

  completeMutation(state, session, coverage, cleanedLayers = 0) {
    const progress = state.houseRescue;
    const home = progress.homes[session.houseId];
    const level = session.level;
    const accuracy = session.correct / Math.max(1, session.correct + session.mistakes);
    const stars = houseRescueStars(session.mistakes);
    const coins = houseRescueReward(level, session.correct, session.mistakes);
    if (state.economy.coins + coins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
    state.economy.coins += coins;
    state.economy.lifetimeCoinsEarned += coins;
    const ledger = appendLedger(state, this.now(), {
      amount: coins,
      kind: "house-rescue-job-reward",
      reason: `House Rescue Level ${level} at ${session.houseId}`,
      houseId: session.houseId,
      jobSerial: session.jobSerial,
      level,
      score: session.score,
      mistakes: session.mistakes,
      accuracy: Math.round(accuracy * 100),
      stars,
      coverage: Math.round(coverage * 100),
    });
    const previous = progress.best[level];
    progress.best[level] = {
      score: previous ? Math.max(previous.score, session.score) : session.score,
      stars: previous ? Math.max(previous.stars, stars) : stars,
      mistakes: previous ? Math.min(previous.mistakes, session.mistakes) : session.mistakes,
      completed: (previous?.completed || 0) + 1,
    };
    progress.completed = Object.keys(progress.best).length;
    progress.totalStars = Object.values(progress.best).reduce((sum, record) => sum + record.stars, 0);
    progress.unlockedLevel = Math.max(progress.unlockedLevel, Math.min(HOUSE_RESCUE_TOTAL_LEVELS, level + 1));
    progress.selectedLevel = Math.min(HOUSE_RESCUE_TOTAL_LEVELS, level + 1);
    progress.lastLevel = level;
    home.dirty = false;
    home.completionCount += 1;
    home.lastCompletedDay = state.world.day;
    home.nextDirtyDay = state.world.day + seededDelay(session.houseId, session.jobSerial);
    home.bestScore = home.bestScore === null ? session.score : Math.max(home.bestScore, session.score);
    home.bestStars = Math.max(home.bestStars, stars);
    home.lastScore = session.score;
    home.lastMistakes = session.mistakes;
    home.lastCoins = coins;
    state.progress.completedJobCount += 1;
    progress.active = null;
    const result = {
      houseId: session.houseId,
      jobSerial: session.jobSerial,
      level,
      score: session.score,
      mistakes: session.mistakes,
      accuracy,
      completionCoverage: coverage,
      stars,
      coins,
      nextLevel: progress.selectedLevel,
    };
    const homeownerGift = queueHomeownerGiftInto(state, {
      source: "house-rescue",
      houseId: session.houseId,
      eventId: `homeowner:house-rescue:${session.houseId}:${session.jobSerial}`,
      now: this.now(),
    });
    return { ok: true, code: "house-rescue-complete", result, cleanedLayers, ledger, homeownerGift };
  }

  qaComplete() {
    return this.commit((state) => {
      const session = state.houseRescue.active;
      if (!session) return { ok: false, code: "no-active-house-rescue", message: "Start a House Rescue first." };
      for (const item of session.items) item.sorted = true;
      const newlySorted = session.items.length - session.correct;
      state.houseRescue.lifetimeItemsSorted += newlySorted;
      session.correct = session.items.length;
      session.score = session.correct * HOUSE_RESCUE_RULES.correctScore + session.mistakes * HOUSE_RESCUE_RULES.wrongScore;
      session.phase = "vacuum";
      let totalLayers = 0;
      for (const stain of session.dirt) { totalLayers += stain.remaining; stain.remaining = 0; }
      state.houseRescue.lifetimeStainLayers += totalLayers;
      return this.completeMutation(state, session, 1, totalLayers);
    });
  }

  abandon() {
    if (!this.getActiveSession()) return { ok: false, code: "no-active-house-rescue" };
    return this.commit((state) => { state.houseRescue.active = null; return { ok: true, code: "house-rescue-abandoned" }; });
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      catalogueValid: this.catalogueValidation.valid,
      totalLevels: this.catalogueValidation.totalLevels,
      levelRange: { first: this.catalogueValidation.first, last: this.catalogueValidation.last },
      categories: this.catalogueValidation.categories,
      rewardRange: this.catalogueValidation.rewardRange,
      completionCoverage: HOUSE_RESCUE_RULES.completionCoverage,
      visibleItemsPerWave: HOUSE_RESCUE_RULES.visibleItemsPerWave,
      unlockedLevel: state.unlockedLevel,
      completedLevels: state.completed,
      totalStars: state.totalStars,
      dirtyHomes: Object.values(state.homes).filter((home) => home.dirty).map((home) => home.houseId),
      activeSession: Boolean(state.active),
    };
  }
}
