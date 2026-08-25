import Phaser from "phaser";
import {
  WASTE_RUBBISH_CATALOG,
  WASTE_TOTAL_LEVELS,
  WASTE_WORLD,
  WasteCollectionEngine,
  wasteLevelSummary,
} from "../data/wasteCollection.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value);
}

export class WasteCollectionScene extends Phaser.Scene {
  constructor() { super("WasteCollectionScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.exitArmedUntil = 0;
    this.collected = new Set();
    this.itemObjects = new Map();
    this.lastCampaignResult = null;
    this.hintTileId = null;
  }

  create() {
    this.cleanup = this.registry.get("cleanupService");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "waste";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawBackdrop();
    this.bindCampaignInterface();
    this.session = this.cleanup?.getActiveSession();
    if (this.session?.mode === "town-job") this.startTownJobPresentation();
    else this.startCampaignPresentation();
    this.setSceneInterface();
    this.cameras.main.fadeIn(220, 30, 56, 39);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawBackdrop() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x5b9649);
    const art = this.add.graphics();
    art.fillStyle(0x8bc86f, 0.62); art.fillRoundedRect(25, 25, 1230, 670, 60);
    art.fillStyle(0xd9c29a, 1); art.fillRoundedRect(55, 310, 1170, 95, 28);
    art.fillStyle(0x3e713f, 1);
    for (const [x, y] of [[105, 95], [1130, 110], [150, 610], [1080, 600]]) art.fillCircle(x, y, 72);
    art.fillStyle(0x765238, 1); art.fillRect(98, 120, 16, 80); art.fillRect(1122, 130, 16, 80);
    for (let index = 0; index < 95; index += 1) {
      art.fillStyle(index % 3 ? 0x9bd17a : 0x477a3f, 0.35);
      art.fillCircle(35 + ((index * 137) % 1210), 35 + ((index * 83) % 650), 2 + (index % 3));
    }
    this.add.text(ROOM.width / 2, 27, "WASTE COLLECTION · WILLOWMERE PARK TEAM", { color: "#fff6c9", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold", stroke: "#283d32", strokeThickness: 5 }).setOrigin(0.5);
  }

  bindCampaignInterface() {
    this.campaignHud = document.querySelector("#waste-campaign-hud");
    this.levelSelect = document.querySelector("#waste-level-select");
    this.startButton = document.querySelector("#waste-level-start");
    this.exitButton = document.querySelector("#waste-campaign-exit");
    this.boardElement = document.querySelector("#waste-board");
    this.trayElement = document.querySelector("#waste-tray");
    this.buttons = {
      hint: document.querySelector("#waste-hint"), retry: document.querySelector("#waste-retry"), qa: document.querySelector("#waste-qa-solve"),
      replay: document.querySelector("#waste-replay"), next: document.querySelector("#waste-next"), return: document.querySelector("#waste-return"),
    };
    this.onStart = () => this.startCampaignLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Start Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.requestExit();
    this.onBoardClick = (event) => { const button = event.target.closest("[data-waste-tile]"); if (button && !button.disabled) this.selectCampaignTile(Number(button.dataset.wasteTile)); };
    this.onHint = () => this.showHint();
    this.onRetry = () => this.restartCampaign();
    this.onQa = () => this.runCertifiedClear();
    this.onReplay = () => this.startCampaignLevel(this.lastCampaignResult?.level || this.session?.assignedLevel || 1);
    this.onNext = () => this.startCampaignLevel((this.lastCampaignResult?.level || 1) >= WASTE_TOTAL_LEVELS ? 1 : (this.lastCampaignResult?.level || 1) + 1);
    this.onReturn = () => this.returnToTown(true);
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); this.requestExit(); return; }
      if (event.key.toLowerCase() === "h" && this.session?.mode === "campaign") { event.preventDefault(); this.showHint(); }
    };
    this.startButton?.addEventListener("click", this.onStart); this.levelSelect?.addEventListener("change", this.onLevelChange); this.exitButton?.addEventListener("click", this.onExit);
    this.boardElement?.addEventListener("click", this.onBoardClick); this.buttons.hint?.addEventListener("click", this.onHint); this.buttons.retry?.addEventListener("click", this.onRetry); this.buttons.qa?.addEventListener("click", this.onQa);
    this.buttons.replay?.addEventListener("click", this.onReplay); this.buttons.next?.addEventListener("click", this.onNext); this.buttons.return?.addEventListener("click", this.onReturn);
    window.addEventListener("keydown", this.onKeyDown);
  }

  startCampaignPresentation() {
    this.campaignHud?.classList.remove("hidden");
    document.querySelector("#cleanup-hud")?.classList.add("hidden");
    document.querySelector("#cleanup-result")?.classList.add("hidden");
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode);
    this.populateLevelSelect();
    if (this.session?.mode === "campaign") {
      document.querySelector("#waste-campaign-picker")?.classList.add("hidden");
      document.querySelector("#waste-campaign-gameplay")?.classList.remove("hidden");
      document.querySelector("#waste-campaign-result")?.classList.add("hidden");
      this.setCampaignMessage(this.session.status === "failed" ? "The five-slot tray is full. Replay this level to try another matching order." : "Choose an uncovered rubbish card. Three matching cards clear automatically.", this.session.status === "failed" ? "error" : "success");
    } else {
      document.querySelector("#waste-campaign-picker")?.classList.remove("hidden");
      document.querySelector("#waste-campaign-gameplay")?.classList.add("hidden");
      document.querySelector("#waste-campaign-result")?.classList.add("hidden");
      this.setCampaignMessage("Choose any of the 750 authored Waste Collection levels.", "neutral");
    }
    this.renderCampaign();
  }

  populateLevelSelect() {
    if (!this.levelSelect) return;
    const progress = this.cleanup.getCampaignSnapshot();
    if (this.levelSelect.options.length !== WASTE_TOTAL_LEVELS) {
      const options = [];
      for (let level = 1; level <= WASTE_TOTAL_LEVELS; level += 1) {
        const summary = wasteLevelSummary(level);
        options.push(`<option value="${level}">Level ${level} · ${summary.tileCount} cards · ${summary.layers} layers</option>`);
      }
      this.levelSelect.innerHTML = options.join("");
    }
    this.levelSelect.value = String(this.session?.assignedLevel || progress.nextLevel);
    this.onLevelChange();
  }

  startCampaignLevel(level) {
    const active = this.cleanup.getActiveSession();
    if (active) this.cleanup.cancel(active.id);
    const result = this.cleanup.beginCampaign(level, {
      returnPosition: active?.returnPosition || this.entryData.returnPosition,
      returnFacing: active?.returnFacing || this.entryData.returnFacing || "down",
    });
    if (!result.ok) { this.setCampaignMessage(result.message, "error"); return false; }
    this.session = result.session;
    this.lastCampaignResult = null;
    this.hintTileId = null;
    document.querySelector("#waste-campaign-picker")?.classList.add("hidden");
    document.querySelector("#waste-campaign-gameplay")?.classList.remove("hidden");
    document.querySelector("#waste-campaign-result")?.classList.add("hidden");
    this.setCampaignMessage("Choose an uncovered card. Match rubbish in triples before the five-slot tray fills.", "success");
    this.renderCampaign();
    return true;
  }

  selectCampaignTile(tileId) {
    if (!this.session || this.session.mode !== "campaign") return false;
    this.hintTileId = null;
    const result = this.cleanup.selectCampaignTile(this.session.id, tileId);
    if (!result.ok) { this.setCampaignMessage(result.message, "error"); return false; }
    if (result.code === "waste-campaign-completed") {
      this.lastCampaignResult = result.result;
      this.session = null;
      this.showCampaignResult(result.result);
      return true;
    }
    this.session = this.cleanup.getActiveSession();
    const rubbish = result.matchedTypeId === null ? result.tile.label : WASTE_RUBBISH_CATALOG[result.matchedTypeId].label;
    if (result.code === "tray-full") this.setCampaignMessage("The tray reached five cards. Replay and choose a different exposed-card order.", "error");
    else if (result.code === "triple-matched") this.setCampaignMessage(`${rubbish} triple matched and cleared from the tray.`, "success");
    else this.setCampaignMessage(`${rubbish} collected. Keep matching groups of three.`, "neutral");
    this.renderCampaign();
    return true;
  }

  renderCampaign() {
    const progress = this.cleanup.getCampaignSnapshot();
    setText("#waste-campaign-summary", `${progress.completed} cleared · ${progress.totalStars} stars · Level ${progress.nextLevel} next`);
    setText("#waste-campaign-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    if (!this.session || this.session.mode !== "campaign") { this.updateDomState(); return; }
    const engine = new WasteCollectionEngine(this.session.assignedLevel, this.session);
    const state = engine.snapshot();
    const summary = wasteLevelSummary(this.session.assignedLevel);
    const exposed = new Set(state.exposedIds);
    setText("#waste-level-name", `Level ${summary.level} of ${WASTE_TOTAL_LEVELS}${summary.checkpoint ? " · checkpoint" : ""}`);
    setText("#waste-level-band", `${summary.tileCount} cards · ${summary.typeCount} types · ${summary.layers} layers · difficulty ${summary.difficulty}`);
    setText("#waste-level-remaining", state.remaining); setText("#waste-level-matches", state.matches); setText("#waste-level-tray-count", `${state.tray.length} / 5`);
    if (this.boardElement) {
      const fragment = document.createDocumentFragment();
      for (const tile of engine.tiles.filter((entry) => !entry.removed).sort((a, b) => a.layer - b.layer || a.id - b.id)) {
        const button = document.createElement("button");
        const isExposed = exposed.has(tile.id);
        button.type = "button";
        button.className = `waste-card${isExposed ? "" : " blocked"}${this.hintTileId === tile.id ? " safe-hint" : ""}`;
        button.dataset.wasteTile = String(tile.id);
        button.disabled = !isExposed || this.session.status === "failed";
        button.style.left = `${(tile.x / WASTE_WORLD.width) * 100}%`;
        button.style.top = `${(tile.y / WASTE_WORLD.height) * 100}%`;
        button.style.zIndex = String(10 + tile.layer * 150 + tile.id);
        button.style.setProperty("--card-rotation", `${tile.rotation}deg`);
        button.title = tile.label;
        button.setAttribute("aria-label", isExposed ? `Select ${tile.label}` : `${tile.label}, blocked`);
        const icon = document.createElement("span"); icon.setAttribute("aria-hidden", "true"); icon.textContent = tile.icon;
        const layer = document.createElement("small"); layer.textContent = String(tile.layer + 1);
        button.append(icon, layer); fragment.appendChild(button);
      }
      this.boardElement.replaceChildren(fragment);
      this.boardElement.setAttribute("aria-label", `Waste Collection Level ${summary.level}, ${state.remaining} of ${state.total} cards remaining, ${state.tray.length} of 5 tray slots filled`);
    }
    if (this.trayElement) {
      const slots = [];
      for (let index = 0; index < 5; index += 1) slots.push(`<span class="waste-tray-slot${state.tray[index] === undefined ? "" : " filled"}">${state.tray[index] === undefined ? "·" : WASTE_RUBBISH_CATALOG[state.tray[index]].icon}</span>`);
      this.trayElement.innerHTML = slots.join("");
    }
    if (this.buttons.hint) this.buttons.hint.disabled = this.session.status === "failed";
    if (this.buttons.retry) this.buttons.retry.disabled = this.session.moves === 0;
    if (this.buttons.qa) this.buttons.qa.disabled = this.session.status === "failed";
    this.updateDomState();
  }

  showHint() {
    if (!this.session || this.session.mode !== "campaign" || this.session.status === "failed") return false;
    const engine = new WasteCollectionEngine(this.session.assignedLevel, this.session);
    let choice = null;
    for (const tileId of engine.exposedIds()) {
      const candidate = new WasteCollectionEngine(this.session.assignedLevel, this.session);
      const result = candidate.select(tileId);
      if (result.code === "triple-matched") { choice = tileId; break; }
      if (result.code !== "tray-full" && choice === null) choice = tileId;
    }
    if (choice === null) { this.setCampaignMessage("No safe exposed card remains; replay the level with a different order.", "error"); return false; }
    this.hintTileId = choice;
    const tile = engine.tiles.find((entry) => entry.id === choice);
    this.setCampaignMessage(`Hint: ${tile.label} is a safe exposed choice.`, "hint");
    this.renderCampaign();
    return true;
  }

  restartCampaign() {
    if (!this.session || this.session.mode !== "campaign") return false;
    const result = this.cleanup.restartCampaign(this.session.id);
    if (!result.ok) { this.setCampaignMessage(result.message, "error"); return false; }
    this.session = result.session;
    this.hintTileId = null;
    this.setCampaignMessage("Level restarted. Choose an uncovered card and keep the five-slot tray below capacity.", "success");
    this.renderCampaign();
    return true;
  }

  runCertifiedClear() {
    if (!this.qaMode || !this.session) return false;
    const result = this.cleanup.completeCertifiedCampaign(this.session.id);
    if (!result.ok) { this.setCampaignMessage(result.message, "error"); return false; }
    this.lastCampaignResult = result.result;
    this.session = null;
    this.showCampaignResult(result.result);
    return true;
  }

  showCampaignResult(result) {
    document.querySelector("#waste-campaign-gameplay")?.classList.add("hidden");
    document.querySelector("#waste-campaign-result")?.classList.remove("hidden");
    setText("#waste-result-title", "Park restored!"); setText("#waste-result-stars", "★★★");
    setText("#waste-result-message", result.firstClear ? "The first clear is saved and its KindlyCoins were added once." : "Your best result remains saved. Campaign replays do not pay again.");
    setText("#waste-result-percent", "100%"); setText("#waste-result-moves", result.moves); setText("#waste-result-matches", result.matches); setText("#waste-result-coins", `+${result.rewardCoins}`);
    if (this.buttons.next) this.buttons.next.textContent = result.level >= WASTE_TOTAL_LEVELS ? "Back to Level 1" : "Next level";
    this.setCampaignMessage(`Waste Collection Level ${result.level} completed and safely saved.`, "success");
    this.renderCampaign();
  }

  setCampaignMessage(message, status = "neutral") {
    const element = document.querySelector("#waste-campaign-status");
    if (element) { element.textContent = message; element.dataset.status = status; }
  }

  startTownJobPresentation() {
    this.job = this.cleanup.getJob(this.session.targetId);
    if (!this.job) { this.returnToTown(false); return; }
    this.campaignHud?.classList.add("hidden");
    this.townHud = document.querySelector("#cleanup-hud");
    this.townHud?.classList.remove("hidden");
    setText("#cleanup-status", "Choose each piece of rubbish in Willow Commons.");
    const list = document.querySelector("#cleanup-item-list");
    if (list) list.innerHTML = this.job.items.map((item) => `<button type="button" data-cleanup-item="${item.id}"><span>${item.icon}</span><span>${item.label}</span></button>`).join("");
    this.onTownItem = (event) => { const button = event.target.closest("[data-cleanup-item]"); if (button) this.collectTownItem(button.dataset.cleanupItem); };
    this.onTownFinish = () => this.finishTownJob();
    this.onTownExit = () => this.returnToTown(false);
    this.onTownResult = () => this.returnToTown(true);
    list?.addEventListener("click", this.onTownItem);
    document.querySelector("#cleanup-finish")?.addEventListener("click", this.onTownFinish);
    document.querySelector("#cleanup-exit")?.addEventListener("click", this.onTownExit);
    document.querySelector("#cleanup-result-return")?.addEventListener("click", this.onTownResult);
    for (const item of this.job.items) this.drawTownRubbish(item);
    this.renderTownJob();
  }

  drawTownRubbish(item) {
    const backing = this.add.rectangle(0, 0, 78, 64, item.color, 0.96).setStrokeStyle(4, 0x294637, 0.72);
    const icon = this.add.text(0, -3, item.icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "31px" }).setOrigin(0.5);
    const object = this.add.container(item.x, item.y, [backing, icon]).setSize(105, 95).setInteractive({ useHandCursor: true });
    object.on("pointerdown", () => this.collectTownItem(item.id)); this.itemObjects.set(item.id, object);
  }

  collectTownItem(itemId) {
    if (this.collected.has(itemId)) return false;
    const object = this.itemObjects.get(itemId); if (!object) return false;
    this.collected.add(itemId); object.disableInteractive();
    this.tweens.add({ targets: object, y: object.y - 25, alpha: 0, scale: 0.45, duration: 210 });
    this.renderTownJob();
    return true;
  }

  renderTownJob() {
    const count = this.collected.size; const total = this.job.items.length;
    const progress = document.querySelector("#cleanup-progress"); if (progress) { progress.max = total; progress.value = count; }
    setText("#cleanup-progress-text", `${count} / ${total} collected`);
    setText("#cleanup-status", count === total ? "All six pieces are ready. Finish the cleanup to save the park." : `${total - count} pieces remain in Willow Commons.`);
    const finish = document.querySelector("#cleanup-finish"); if (finish) finish.disabled = count !== total;
    for (const button of document.querySelectorAll("[data-cleanup-item]")) { const done = this.collected.has(button.dataset.cleanupItem); button.disabled = done; button.classList.toggle("collected", done); }
    this.updateDomState();
  }

  finishTownJob() {
    if (this.collected.size !== this.job.items.length) return false;
    const result = this.cleanup.complete(this.session.id, { collectedItemIds: [...this.collected] });
    if (!result.ok) { setText("#cleanup-status", result.message); return false; }
    setText("#cleanup-result-coins", `+${result.rewardCoins}`); setText("#cleanup-result-balance", result.balance);
    const panel = document.querySelector("#cleanup-result"); panel?.classList.remove("hidden"); panel?.setAttribute("aria-hidden", "false");
    return true;
  }

  requestExit() {
    if (this.session?.mode === "town-job") return this.returnToTown(false);
    if (this.session?.mode === "campaign" && this.session.moves > 0 && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000;
      if (this.exitButton) this.exitButton.textContent = "Confirm exit level";
      this.setCampaignMessage("Press Confirm exit level within three seconds to abandon only this attempt.", "error");
      return false;
    }
    return this.returnToTown(false);
  }

  returnToTown(completed) {
    if (this.transitioning) return false;
    this.transitioning = true;
    const active = this.cleanup?.getActiveSession();
    const returnPosition = active?.returnPosition || this.session?.returnPosition || this.entryData.returnPosition || { x: 1738, y: 1340 };
    const returnFacing = active?.returnFacing || this.session?.returnFacing || this.entryData.returnFacing || "down";
    if (active) this.cleanup.cancel(active.id);
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    this.cameras.main.fadeOut(220, 30, 56, 39);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, completedCleanupTarget: completed ? this.session?.targetId : null }));
    return true;
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge"); if (badge) badge.textContent = "WASTE COLLECTION · MILESTONE 17";
    setText("#location-status", this.session?.mode === "town-job" ? this.job?.title : "Waste Collection Campaign");
    setText("#control-hint", "Tap uncovered cards · match three · H shows a safe card · landscape play");
    setText("#landscape-required-message", "Waste Collection is designed for landscape play. Turn your phone sideways to continue matching rubbish.");
  }

  updateDomState() {
    const game = document.querySelector("#game"); if (!game) return;
    const active = this.cleanup?.getActiveSession(); const diagnostics = this.cleanup?.getDiagnostics();
    game.dataset.scene = this.scene.key; game.dataset.wasteMode = active?.mode || (this.lastCampaignResult ? "result" : "picker");
    game.dataset.wasteLevel = String(active?.assignedLevel || this.lastCampaignResult?.level || diagnostics?.wasteProgress?.nextLevel || 1);
    game.dataset.wasteRemaining = String(active?.mode === "campaign" ? this.cleanup.getCampaignSessionState()?.remaining : this.job ? this.job.items.length - this.collected.size : 0);
    game.dataset.wasteCompleted = String(diagnostics?.wasteProgress?.completed || 0); game.dataset.wasteCatalogue = String(diagnostics?.totalLevels || 0);
    game.dataset.wasteCatalogueValid = String(Boolean(diagnostics?.catalogueValid));
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.exitButton?.removeEventListener("click", this.onExit);
    this.boardElement?.removeEventListener("click", this.onBoardClick); this.buttons?.hint?.removeEventListener("click", this.onHint); this.buttons?.retry?.removeEventListener("click", this.onRetry); this.buttons?.qa?.removeEventListener("click", this.onQa);
    this.buttons?.replay?.removeEventListener("click", this.onReplay); this.buttons?.next?.removeEventListener("click", this.onNext); this.buttons?.return?.removeEventListener("click", this.onReturn);
    window.removeEventListener("keydown", this.onKeyDown);
    const list = document.querySelector("#cleanup-item-list"); list?.removeEventListener("click", this.onTownItem);
    document.querySelector("#cleanup-finish")?.removeEventListener("click", this.onTownFinish); document.querySelector("#cleanup-exit")?.removeEventListener("click", this.onTownExit); document.querySelector("#cleanup-result-return")?.removeEventListener("click", this.onTownResult);
    this.campaignHud?.classList.add("hidden"); this.townHud?.classList.add("hidden"); document.querySelector("#cleanup-result")?.classList.add("hidden");
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return { scene: this.scene.key, gameplayConnected: true, portraitSupported: false, landscapeRequiredOnMobile: true, ...this.cleanup.getDiagnostics(), session: this.cleanup.getActiveSession(), campaignState: this.cleanup.getCampaignSessionState(), legacySaveUntouched: true };
  }
}
