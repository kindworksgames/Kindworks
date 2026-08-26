import { WORLD_TIME_CONFIG } from "../data/worldSimulation.js";
import { advanceWorldState } from "../state/worldState.js";

function isoTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export class WorldSimulationService {
  constructor(gameState, repository, {
    now = () => Date.now(),
    saveEveryGameMinutes = WORLD_TIME_CONFIG.saveEveryGameMinutes,
  } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.saveEveryGameMinutes = saveEveryGameMinutes;
    this.pauseReasons = new Set();
    this.fractionalGameMinutes = 0;
    this.unsavedGameMinutes = 0;
    this.stateAdvancers = [];
    this.lastResult = { ok: true, status: "ready" };
  }

  addStateAdvancer(advancer) {
    if (typeof advancer !== "function") throw new TypeError("A world state advancer must be a function.");
    this.stateAdvancers.push(advancer);
    return () => {
      const index = this.stateAdvancers.indexOf(advancer);
      if (index >= 0) this.stateAdvancers.splice(index, 1);
    };
  }

  touch(now = this.now()) {
    const next = this.gameState.getSnapshot();
    const timestamp = isoTime(now);
    if (!timestamp) return { ok: false, status: "invalid-time" };
    next.world.simulation.lastResolvedAt = timestamp;
    next.updatedAt = timestamp;
    return this.gameState.replace(next);
  }

  advance(gameMinutes, { now = this.now(), offline = false, persist = false } = {}) {
    const before = this.gameState.getSnapshot();
    const result = advanceWorldState(before.world, gameMinutes, { now, offline });
    const next = structuredClone(before);
    next.world = result.world;
    next.updatedAt = isoTime(now) || next.updatedAt;
    try {
      for (const advancer of this.stateAdvancers) advancer(next, before, result);
    } catch (error) {
      return { ok: false, status: "state-advancer-failed", message: String(error) };
    }
    const replaced = this.gameState.replace(next);
    if (!replaced.ok) return { ...replaced, status: "state-rejected" };
    this.unsavedGameMinutes += result.advancedGameMinutes;
    let saveResult = null;
    if (persist || result.crossedDays > 0 || this.unsavedGameMinutes >= this.saveEveryGameMinutes) {
      saveResult = this.repository?.save?.(this.gameState.getSnapshot(), { now });
      if (saveResult?.ok) this.unsavedGameMinutes = 0;
    }
    this.lastResult = { ok: true, status: offline ? "offline-resolved" : "advanced", ...result, saveResult };
    return this.lastResult;
  }

  tick(deltaMilliseconds, { now = this.now() } = {}) {
    if (this.pauseReasons.size) return { ok: true, status: "paused", reasons: [...this.pauseReasons] };
    const boundedDelta = Math.max(0, Math.min(1000, Number(deltaMilliseconds) || 0));
    this.fractionalGameMinutes += (boundedDelta / 1000) * WORLD_TIME_CONFIG.gameMinutesPerRealSecond;
    const wholeMinutes = Math.floor(this.fractionalGameMinutes);
    if (wholeMinutes < 1) return { ok: true, status: "waiting", fractionalGameMinutes: this.fractionalGameMinutes };
    this.fractionalGameMinutes -= wholeMinutes;
    return this.advance(wholeMinutes, { now });
  }

  resolveOffline({ now = this.now(), persist = true } = {}) {
    const snapshot = this.gameState.getSnapshot();
    const lastResolved = Date.parse(snapshot.world.simulation.lastResolvedAt);
    const elapsedMilliseconds = Math.max(0, Number(now) - lastResolved);
    const requestedGameMinutes = Math.floor((elapsedMilliseconds / 1000) * WORLD_TIME_CONFIG.gameMinutesPerRealSecond);
    if (requestedGameMinutes < 1) {
      this.touch(now);
      this.lastResult = { ok: true, status: "offline-none", requestedGameMinutes: 0, advancedGameMinutes: 0, capped: false };
      return this.lastResult;
    }
    return this.advance(requestedGameMinutes, { now, offline: true, persist });
  }

  pause(reason, { now = this.now(), persist = false } = {}) {
    if (!reason) return { ok: false, status: "missing-reason" };
    this.pauseReasons.add(reason);
    const touched = this.touch(now);
    const saveResult = persist && touched.ok ? this.repository?.save?.(this.gameState.getSnapshot(), { now }) : null;
    if (saveResult?.ok) this.unsavedGameMinutes = 0;
    return { ok: touched.ok, status: "paused", reason, saveResult };
  }

  resume(reason, { now = this.now(), resolveOffline = false } = {}) {
    const wasPaused = this.pauseReasons.delete(reason);
    if (!wasPaused) return { ok: true, status: "already-running" };
    return resolveOffline ? this.resolveOffline({ now, persist: true }) : { ...this.touch(now), status: "resumed" };
  }

  setPaused(reason, paused, options = {}) {
    return paused ? this.pause(reason, options) : this.resume(reason, options);
  }

  persist({ now = this.now() } = {}) {
    const touched = this.touch(now);
    if (!touched.ok) return touched;
    const result = this.repository?.save?.(this.gameState.getSnapshot(), { now }) || { ok: false, status: "repository-missing" };
    if (result.ok) this.unsavedGameMinutes = 0;
    return result;
  }

  getDiagnostics() {
    const world = this.gameState.getSnapshot().world;
    return {
      day: world.day,
      clockMinutes: world.clockMinutes,
      weather: { ...world.weather.current },
      lightingSource: "world-clock",
      gameMinutesPerRealSecond: WORLD_TIME_CONFIG.gameMinutesPerRealSecond,
      paused: this.pauseReasons.size > 0,
      pauseReasons: [...this.pauseReasons],
      maxOfflineGameMinutes: WORLD_TIME_CONFIG.maxOfflineGameMinutes,
      lastOfflineGameMinutes: world.simulation.lastOfflineGameMinutes,
      lastOfflineWasCapped: world.simulation.lastOfflineWasCapped,
      lastResult: { ...this.lastResult },
    };
  }
}
