import { ensureLazyScene } from "../scenes/lazyScenes.js";
import { FIDELITY_ACTIVITIES, getFidelityContract, prepareFidelityLevel } from "./fidelityContract.js";

const ACTIVITY_DATA = Object.freeze({
  lawn: Object.freeze({ scene: "LawnCareScene" }),
  river: Object.freeze({ scene: "RiverClearoutScene" }),
  waste: Object.freeze({ scene: "WasteCollectionScene" }),
  "house-rescue": Object.freeze({ scene: "HouseRescueScene", houseId: "house-1" }),
  beach: Object.freeze({ scene: "BeachCleanupScene" }),
  powerwash: Object.freeze({ scene: "PlaygroundPowerwashScene" }),
  fishing: Object.freeze({ scene: "FishingScene", mode: "fish", spotId: "fishing-reedbank" }),
  magnet: Object.freeze({ scene: "FishingScene", mode: "magnet", spotId: "magnet-mill-bridge" }),
  bakery: Object.freeze({ scene: "BakeryScene" }),
  cafe: Object.freeze({ scene: "CafeScene" }),
  "morning-mug": Object.freeze({ scene: "MorningMugScene" }),
  "riverside-kitchen": Object.freeze({ scene: "RiversideKitchenScene" }),
  scoops: Object.freeze({ scene: "SouthShoreScoopsScene" }),
  "house-interior": Object.freeze({ scene: "HouseInteriorScene", houseId: "house-20" }),
  "village-grocer": Object.freeze({ scene: "VillageGrocerScene", focusItemId: "carrot-seeds" }),
});

function visible(element) {
  if (!element || element.hidden || element.classList?.contains("hidden")) return false;
  const style = globalThis.getComputedStyle?.(element);
  if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) return false;
  const rect = element.getBoundingClientRect?.();
  return !rect || (rect.width > 0 && rect.height > 0);
}

function controlSnapshot(element) {
  const rect = element.getBoundingClientRect?.() || {};
  return {
    id: element.id || null,
    label: element.getAttribute?.("aria-label") || String(element.textContent || element.value || "").replace(/\s+/g, " ").trim(),
    disabled: Boolean(element.disabled),
    selected: element.getAttribute?.("aria-selected") === "true" || element.getAttribute?.("aria-pressed") === "true" || element.classList?.contains("selected"),
    bounds: { x: Math.round(rect.x || 0), y: Math.round(rect.y || 0), width: Math.round(rect.width || 0), height: Math.round(rect.height || 0) },
  };
}

export class FidelityQaHarness {
  constructor({ game, gameState, repository, storage, fishing }) {
    this.game = game;
    this.gameState = gameState;
    this.repository = repository;
    this.storage = storage;
    this.fishing = fishing;
    this.replay = null;
  }

  getContract() { return getFidelityContract(); }

  mountPanel() {
    if (document.querySelector("#fidelity-qa-panel")) return document.querySelector("#fidelity-qa-panel");
    const panel = document.createElement("details");
    panel.id = "fidelity-qa-panel";
    panel.open = true;
    panel.setAttribute("aria-label", "Phase 3 Fidelity QA controls");
    Object.assign(panel.style, {
      position: "fixed", left: "8px", bottom: "8px", zIndex: "100000", width: "min(340px, calc(100vw - 16px))",
      padding: "8px", border: "2px solid #fff1c8", borderRadius: "10px", background: "rgba(23, 38, 56, .96)",
      color: "#fff1c8", font: "700 12px system-ui", boxShadow: "0 4px 18px rgba(0,0,0,.35)",
    });
    const summary = document.createElement("summary");
    summary.textContent = "Phase 3 Fidelity QA";
    summary.style.cursor = "pointer";
    const row = document.createElement("div");
    Object.assign(row.style, { display: "grid", gridTemplateColumns: "1fr 70px 70px", gap: "6px", marginTop: "8px" });
    const activity = document.createElement("select");
    activity.id = "fidelity-qa-activity";
    activity.setAttribute("aria-label", "Activity to inspect");
    for (const entry of FIDELITY_ACTIVITIES) {
      const option = document.createElement("option");
      option.value = entry.id;
      option.textContent = entry.title;
      activity.append(option);
    }
    const level = document.createElement("input");
    level.id = "fidelity-qa-level";
    level.type = "number";
    level.min = "1";
    level.value = "1";
    level.setAttribute("aria-label", "Representative level");
    const open = document.createElement("button");
    open.id = "fidelity-qa-open";
    open.type = "button";
    open.textContent = "Open";
    const status = document.createElement("output");
    status.id = "fidelity-qa-status";
    status.textContent = "Isolated save active";
    Object.assign(status.style, { display: "block", marginTop: "6px", fontWeight: "500" });
    const syncLevel = () => {
      const entry = FIDELITY_ACTIVITIES.find(({ id }) => id === activity.value);
      level.disabled = !entry?.levels;
      if (entry?.levels) level.max = String(entry.levels);
      else level.removeAttribute("max");
    };
    activity.addEventListener("change", syncLevel);
    open.addEventListener("click", async () => {
      open.disabled = true;
      status.textContent = `Opening ${activity.options[activity.selectedIndex]?.textContent || activity.value}…`;
      try {
        const result = await this.openActivity(activity.value, Number(level.value) || 1);
        status.textContent = result.ok ? `${result.scene}${result.level ? ` · level ${result.level}` : ""}` : result.message || result.code;
      } catch (error) {
        status.textContent = error?.message || "Activity could not be opened.";
      } finally {
        open.disabled = false;
      }
    });
    row.append(activity, level, open);
    panel.append(summary, row, status);
    document.body.append(panel);
    syncLevel();
    return panel;
  }

  resetSandbox() {
    this.storage.clear();
    return { ok: true, code: "fidelity-sandbox-cleared", reloadRequired: true };
  }

  prepareActivity(activityId, levelValue = 1) {
    const activity = FIDELITY_ACTIVITIES.find(({ id }) => id === activityId);
    const route = ACTIVITY_DATA[activityId];
    if (!activity || !route) return { ok: false, code: "unknown-activity", message: `Unknown fidelity activity: ${activityId}` };
    let state = this.gameState.getSnapshot();
    if (activity.levels) state = prepareFidelityLevel(state, activityId, levelValue);
    state.player.scene = route.scene;
    state.updatedAt = new Date().toISOString();
    const replaced = this.gameState.replace(state);
    if (!replaced.ok) return replaced;
    const saved = this.repository.save(this.gameState.getSnapshot());
    return saved.ok
      ? { ok: true, code: "fidelity-activity-prepared", activityId, scene: route.scene, level: activity.levels ? Number(levelValue) : null }
      : saved;
  }

  async openActivity(activityId, levelValue = 1) {
    const prepared = this.prepareActivity(activityId, levelValue);
    if (!prepared.ok) return prepared;
    const route = ACTIVITY_DATA[activityId];
    if (route.mode) {
      this.fishing?.cancel?.();
      const fishing = this.fishing?.begin?.(route.mode, route.spotId, { returnPosition: { x: 640, y: 610 }, returnFacing: "down" });
      if (!fishing?.ok) return fishing || { ok: false, code: "fishing-unavailable" };
    }
    const activeScene = this.game.scene.getScenes(true)[0];
    if (!activeScene) return { ok: false, code: "scene-unavailable", message: "No active Phaser scene is available." };
    await ensureLazyScene(activeScene, route.scene);
    activeScene.scene.start(route.scene, {
      fidelityQa: true,
      requestedLevel: Number(levelValue) || null,
      houseId: route.houseId,
      focusItemId: route.focusItemId,
      returnPosition: { x: 640, y: 610 },
      returnFacing: "down",
    });
    return { ...prepared, code: "fidelity-activity-opened" };
  }

  beginReplay(name, metadata = {}) {
    this.replay = { version: 1, name: String(name || "fidelity-replay"), metadata: structuredClone(metadata), startedAt: new Date().toISOString(), actions: [] };
    return structuredClone(this.replay);
  }

  recordAction(type, payload = {}) {
    if (!this.replay) this.beginReplay("fidelity-replay");
    const action = { index: this.replay.actions.length, type: String(type), payload: structuredClone(payload), recordedAt: new Date().toISOString() };
    this.replay.actions.push(action);
    return structuredClone(action);
  }

  exportReplay() { return this.replay ? structuredClone(this.replay) : null; }

  capture(label = "checkpoint") {
    const activeScene = this.game.scene.getScenes(true)[0];
    const controls = [...document.querySelectorAll("button, [role='button'], input, select, textarea")].filter(visible).map(controlSnapshot);
    const visibleElements = [...document.querySelectorAll("[id]")].filter(visible).map((element) => element.id).filter(Boolean);
    const labelledVisuals = [...document.querySelectorAll("[data-sprite-ai-label]")].filter(visible).map((element) => ({
      id: element.getAttribute("data-sprite-ai-label"),
      kind: element.getAttribute("data-sprite-ai-kind"),
      domId: element.id || null,
    }));
    return {
      contractVersion: getFidelityContract().version,
      label: String(label),
      capturedAt: new Date().toISOString(),
      url: `${location.pathname}${location.search}`,
      viewport: { width: window.innerWidth, height: window.innerHeight, orientation: window.innerWidth >= window.innerHeight ? "landscape" : "portrait" },
      scene: activeScene?.scene?.key || "loading",
      sceneState: typeof activeScene?.getMilestoneState === "function" ? activeScene.getMilestoneState() : null,
      controls,
      visibleElements,
      labelledVisuals,
      bodyDataset: { ...document.body.dataset },
      state: this.gameState.getSnapshot(),
    };
  }
}
