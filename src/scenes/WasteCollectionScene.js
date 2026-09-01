import Phaser from "phaser";
import {
  WASTE_RUBBISH_CATALOG,
  WASTE_SLOT_CONFIG,
  WASTE_TOTAL_LEVELS,
  WASTE_WORLD,
  WasteCollectionEngine,
  wasteCollectionTrayLimit,
  wasteLevelSummary,
} from "../data/wasteCollection.js";
import { fitWasteBoardToViewport, fitWasteCardLayout } from "../ui/WasteCardLayout.js";
import { wasteParkBackdropDataUrl } from "../ui/WasteParkBackdrop.js";

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
    this.campaignInputLocked = false;
    this.currentWasteLayout = null;
    this.layoutFrame = null;
    this.flightNodes = new Set();
  }

  create() {
    this.cleanup = this.registry.get("cleanupService");
    this.onboarding = this.registry.get("onboarding");
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
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x13293d);
  }

  bindCampaignInterface() {
    this.campaignHud = document.querySelector("#waste-campaign-hud");
    this.exitButton = document.querySelector("#waste-campaign-exit");
    this.campaignMenu = document.querySelector(".waste-campaign-menu");
    this.boardViewport = document.querySelector("#waste-board-viewport");
    this.boardStage = document.querySelector("#waste-board-stage");
    this.boardElement = document.querySelector("#waste-board");
    this.trayElement = document.querySelector("#waste-tray");
    this.buttons = {
      hint: document.querySelector("#waste-hint"), retry: document.querySelector("#waste-retry"), qa: document.querySelector("#waste-qa-solve"),
      return: document.querySelector("#waste-return"),
    };
    const closeMenu = () => this.campaignMenu?.removeAttribute("open");
    this.onExit = () => { closeMenu(); this.requestExit(); };
    this.onBoardClick = (event) => { const button = event.target.closest("[data-waste-tile]"); if (button && !button.disabled && !this.campaignInputLocked) void this.selectCampaignTile(Number(button.dataset.wasteTile), button); };
    this.onHint = () => { closeMenu(); this.showHint(); };
    this.onRetry = () => { closeMenu(); this.restartCampaign(); };
    this.onQa = () => { closeMenu(); this.runCertifiedClear(); };
    this.onReturn = () => this.returnToTown(true);
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); this.requestExit(); return; }
      if (event.key.toLowerCase() === "h" && this.session?.mode === "campaign") { event.preventDefault(); this.showHint(); }
    };
    this.exitButton?.addEventListener("click", this.onExit);
    this.boardElement?.addEventListener("click", this.onBoardClick); this.buttons.hint?.addEventListener("click", this.onHint); this.buttons.retry?.addEventListener("click", this.onRetry); this.buttons.qa?.addEventListener("click", this.onQa);
    this.buttons.return?.addEventListener("click", this.onReturn);
    window.addEventListener("keydown", this.onKeyDown);
    this.onViewportResize = () => this.scheduleBoardLayout();
    this.boardResizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(this.onViewportResize) : null;
    this.boardResizeObserver?.observe(this.boardViewport);
    window.addEventListener("resize", this.onViewportResize);
  }

  startCampaignPresentation() {
    this.campaignHud?.classList.remove("hidden");
    document.querySelector("#cleanup-hud")?.classList.add("hidden");
    document.querySelector("#cleanup-result")?.classList.add("hidden");
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode);
    if (this.exitButton) this.exitButton.textContent = "Exit";
    if (!this.session) {
      const level = this.entryData.level || this.cleanup.getCampaignSnapshot().nextLevel;
      this.startCampaignLevel(level);
      return;
    }
    document.querySelector("#waste-campaign-gameplay")?.classList.remove("hidden");
    document.querySelector("#waste-campaign-result")?.classList.add("hidden");
    this.setCampaignMessage(this.session.status === "failed" ? "Tray full. Restart to try another order." : "Pick an uncovered card. Match three before the tray fills.", this.session.status === "failed" ? "error" : "success");
    this.renderCampaign();
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
    document.querySelector("#waste-campaign-gameplay")?.classList.remove("hidden");
    document.querySelector("#waste-campaign-result")?.classList.add("hidden");
    this.setCampaignMessage("Pick an uncovered card. Match three before the tray fills.", "success");
    this.renderCampaign();
    return true;
  }

  async selectCampaignTile(tileId, sourceButton = null) {
    if (!this.session || this.session.mode !== "campaign" || this.campaignInputLocked) return false;
    this.campaignInputLocked = true;
    this.boardElement?.setAttribute("aria-busy", "true");
    this.hintTileId = null;
    const sourceRect = sourceButton?.getBoundingClientRect();
    const sourceIcon = sourceButton?.querySelector("span")?.textContent || "";
    sourceButton?.classList.add("picked");
    const result = this.cleanup.selectCampaignTile(this.session.id, tileId);
    if (!result.ok) {
      this.setCampaignMessage(result.message, "error");
      this.campaignInputLocked = false;
      this.boardElement?.removeAttribute("aria-busy");
      sourceButton?.classList.remove("picked");
      return false;
    }
    try {
      const completed = result.code === "waste-campaign-completed";
      if (!completed) {
        this.session = this.cleanup.getActiveSession();
        const rubbish = result.matchedTypeId === null ? result.tile.label : WASTE_RUBBISH_CATALOG[result.matchedTypeId].label;
        if (result.code === "tray-full") this.setCampaignMessage("Tray full. Try another order.", "error");
        else if (result.code === "triple-matched") this.setCampaignMessage(`${rubbish} matched.`, "success");
        else this.setCampaignMessage(`${rubbish} added.`, "neutral");
        this.renderCampaign();
      }
      await this.animateCardToTray(sourceRect, sourceIcon, result.tile?.typeId ?? null);
      if (result.matchedTypeId !== null && result.matchedTypeId !== undefined) await this.animateTrayMatch(result.matchedTypeId);
      if (completed) {
        this.lastCampaignResult = result.result;
        this.session = null;
        this.showCampaignResult(result.result);
      }
      return true;
    } finally {
      this.campaignInputLocked = false;
      this.boardElement?.removeAttribute("aria-busy");
    }
  }

  renderCampaign() {
    if (this.campaignHud) { this.campaignHud.scrollTop = 0; this.campaignHud.scrollLeft = 0; }
    const gameSnapshot = this.gameState.getSnapshot();
    const trayLimit = wasteCollectionTrayLimit(gameSnapshot);
    setText("#waste-campaign-balance", `🪙 ${gameSnapshot.economy.coins}`);
    if (!this.session || this.session.mode !== "campaign") { this.updateDomState(); return; }
    const engine = new WasteCollectionEngine(this.session.assignedLevel, this.session, { trayLimit });
    const state = engine.snapshot();
    const summary = wasteLevelSummary(this.session.assignedLevel);
    const exposed = new Set(state.exposedIds);
    setText("#waste-campaign-level", `Level ${summary.level} / ${WASTE_TOTAL_LEVELS}`);
    setText("#waste-level-remaining", state.remaining); setText("#waste-level-tray-count", `${state.tray.length} / ${trayLimit}`);
    if (this.boardElement) {
      const fragment = document.createDocumentFragment();
      const remainingTiles = engine.tiles.filter((entry) => !entry.removed);
      const fitted = fitWasteCardLayout(remainingTiles, WASTE_WORLD);
      this.currentWasteLayout = fitted;
      const cardLayout = new Map(fitted.cards.map((card) => [card.id, card]));
      this.boardElement.style.width = `${fitted.bounds.width}px`;
      this.boardElement.style.height = `${fitted.bounds.height}px`;
      this.boardElement.style.setProperty("--waste-park-art", `url("${wasteParkBackdropDataUrl()}")`);
      this.boardElement.style.backgroundPosition = "0px 0px";
      const cleanProgress = Math.max(0, Math.min(1, 1 - state.remaining / Math.max(1, state.total)));
      this.boardElement.style.setProperty("--clean-progress", cleanProgress.toFixed(3));
      this.boardElement.style.setProperty("--grime-opacity", Math.max(0.02, 0.98 - cleanProgress * 1.08).toFixed(3));
      this.boardElement.style.setProperty("--clean-overlay-opacity", Math.min(0.92, 0.12 + cleanProgress * 0.8).toFixed(3));
      for (const tile of remainingTiles.sort((a, b) => a.layer - b.layer || a.id - b.id)) {
        const button = document.createElement("button");
        const layout = cardLayout.get(tile.id);
        const isExposed = exposed.has(tile.id);
        button.type = "button";
        button.className = `waste-card${isExposed ? "" : " blocked"}${this.hintTileId === tile.id ? " safe-hint" : ""}`;
        button.dataset.wasteTile = String(tile.id);
        button.dataset.assetLabel = `KW-WASTE-CARD-${WASTE_RUBBISH_CATALOG[tile.typeId].key.toUpperCase().replaceAll("_", "-")}`;
        button.dataset.cardInstance = String(tile.id);
        button.dataset.exposed = String(isExposed);
        button.dataset.authoredX = String(tile.x);
        button.dataset.authoredY = String(tile.y);
        button.dataset.authoredLayer = String(tile.layer);
        button.dataset.authoredRotation = String(tile.rotation);
        button.disabled = !isExposed || this.session.status === "failed";
        button.style.left = `${layout.x}px`;
        button.style.top = `${layout.y}px`;
        button.style.width = `${layout.width}px`;
        button.style.height = `${layout.height}px`;
        button.style.zIndex = String(20 + tile.layer);
        button.style.setProperty("--card-rotation", `${tile.rotation}deg`);
        button.title = tile.label;
        button.setAttribute("aria-label", isExposed ? `Select ${tile.label}` : `${tile.label}, blocked`);
        const hitArea = document.createElement("i"); hitArea.className = "waste-card-hit"; hitArea.setAttribute("aria-hidden", "true");
        const icon = document.createElement("span"); icon.setAttribute("aria-hidden", "true"); icon.textContent = tile.icon;
        button.append(hitArea, icon); fragment.appendChild(button);
      }
      this.boardElement.replaceChildren(fragment);
      this.boardElement.setAttribute("aria-label", `Waste Collection Level ${summary.level}, ${state.remaining} of ${state.total} cards remaining, ${state.tray.length} of ${trayLimit} tray slots filled`);
      this.scheduleBoardLayout();
    }
    if (this.trayElement) {
      const slots = [];
      for (let index = 0; index < WASTE_SLOT_CONFIG.max; index += 1) {
        const typeId = state.tray[index];
        const item = typeId === undefined ? null : WASTE_RUBBISH_CATALOG[typeId];
        const locked = index >= trayLimit;
        slots.push(`<span class="waste-tray-slot${item ? " filled" : ""}${locked ? " capacity-locked" : ""}" data-slot-index="${index}"${item ? ` data-type-id="${typeId}"` : ""} data-asset-label="KW-WASTE-TRAY-SLOT-${index + 1}" aria-label="${locked ? `Tray slot ${index + 1}, unlock with another bin` : item ? item.label : `Empty tray slot ${index + 1}`}">${locked ? `<i aria-hidden="true">🔒</i>` : item ? `<i aria-hidden="true">${item.icon}</i>` : ""}</span>`);
      }
      this.trayElement.innerHTML = slots.join("");
      this.trayElement.setAttribute("aria-label", `Collection tray, ${trayLimit} of ${WASTE_SLOT_CONFIG.max} slots unlocked`);
      this.trayElement.style.setProperty("--waste-tray-limit", String(trayLimit));
    }
    if (this.buttons.hint) {
      this.buttons.hint.disabled = this.session.status === "failed";
      this.buttons.hint.classList.toggle("hidden", this.session.status === "failed");
    }
    if (this.buttons.retry) {
      this.buttons.retry.disabled = this.session.moves === 0;
      this.buttons.retry.classList.toggle("hidden", this.session.moves === 0);
    }
    if (this.buttons.qa) this.buttons.qa.disabled = this.session.status === "failed";
    this.updateDomState();
  }

  scheduleBoardLayout() {
    if (this.layoutFrame !== null) cancelAnimationFrame(this.layoutFrame);
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = null;
      this.updateBoardLayout();
    });
  }

  updateBoardLayout() {
    if (!this.currentWasteLayout || !this.boardViewport || !this.boardStage || !this.boardElement) return;
    const fitted = fitWasteBoardToViewport(
      this.currentWasteLayout.bounds,
      this.boardViewport.clientWidth,
      this.boardViewport.clientHeight,
    );
    this.boardStage.style.width = `${fitted.width}px`;
    this.boardStage.style.height = `${fitted.height}px`;
    this.boardStage.style.aspectRatio = `${this.currentWasteLayout.bounds.width} / ${this.currentWasteLayout.bounds.height}`;
    this.boardElement.style.transform = `scale(${fitted.scale})`;
    this.boardElement.style.setProperty("--waste-layout-scale", fitted.scale.toFixed(4));
  }

  async animateCardToTray(sourceRect, icon, typeId = null) {
    if (!sourceRect || !icon) return;
    const matchingSlots = typeId === null ? [] : [...(this.trayElement?.querySelectorAll(`[data-type-id="${typeId}"]`) || [])];
    const target = matchingSlots.at(-1) || [...(this.trayElement?.querySelectorAll(".waste-tray-slot:not(.capacity-locked)") || [])]
      .find((slot) => !slot.classList.contains("filled")) || this.trayElement?.querySelector(".waste-tray-slot:not(.capacity-locked):last-child");
    const targetRect = target?.getBoundingClientRect();
    if (!targetRect) return;
    const clone = document.createElement("span");
    clone.className = "waste-card-flight";
    clone.textContent = icon;
    clone.setAttribute("aria-hidden", "true");
    Object.assign(clone.style, { left: `${sourceRect.left}px`, top: `${sourceRect.top}px`, width: `${sourceRect.width}px`, height: `${sourceRect.height}px` });
    document.body.appendChild(clone);
    this.flightNodes.add(clone);
    const destinationX = targetRect.left + (targetRect.width - sourceRect.width) / 2 - sourceRect.left;
    const destinationY = targetRect.top + (targetRect.height - sourceRect.height) / 2 - sourceRect.top;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    try {
      await clone.animate([
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${destinationX}px, ${destinationY}px) scale(.48)`, opacity: 0.95 },
      ], { duration: reduced ? 1 : 190, easing: "cubic-bezier(.2,.8,.25,1)", fill: "forwards" }).finished;
    } catch { /* A scene shutdown can cancel a cosmetic animation safely. */ }
    clone.remove();
    this.flightNodes.delete(clone);
  }

  async animateTrayMatch(typeId) {
    const item = WASTE_RUBBISH_CATALOG[typeId];
    const trayRect = this.trayElement?.getBoundingClientRect();
    if (!item || !trayRect) return;
    const centreX = trayRect.left + trayRect.width / 2;
    const centreY = trayRect.top + trayRect.height / 2;
    const tokens = [-1, 0, 1].map((offset) => {
      const token = document.createElement("span");
      token.className = "waste-match-token";
      token.textContent = item.icon;
      token.setAttribute("aria-hidden", "true");
      Object.assign(token.style, { left: `${centreX + offset * 50 - 18}px`, top: `${centreY - 18}px` });
      document.body.appendChild(token);
      this.flightNodes.add(token);
      return token;
    });
    const burst = document.createElement("span");
    burst.className = "waste-match-burst";
    burst.textContent = "✦";
    burst.setAttribute("aria-hidden", "true");
    Object.assign(burst.style, { left: `${centreX - 24}px`, top: `${centreY - 24}px` });
    document.body.appendChild(burst);
    this.flightNodes.add(burst);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    try {
      await Promise.all(tokens.map((token, index) => token.animate([
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${(1 - index) * 50}px, 0) scale(.6)`, opacity: 0 },
      ], { duration: reduced ? 1 : 210, easing: "ease-in", fill: "forwards" }).finished));
    } catch { /* Cosmetic animation cancellation must not affect the saved move. */ }
    for (const node of [...tokens, burst]) { node.remove(); this.flightNodes.delete(node); }
  }

  showHint() {
    if (!this.session || this.session.mode !== "campaign" || this.session.status === "failed") return false;
    const trayLimit = wasteCollectionTrayLimit(this.gameState.getSnapshot());
    const engine = new WasteCollectionEngine(this.session.assignedLevel, this.session, { trayLimit });
    let choice = null;
    for (const tileId of engine.exposedIds()) {
      const candidate = new WasteCollectionEngine(this.session.assignedLevel, this.session, { trayLimit });
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
    this.setCampaignMessage("Level restarted. Pick an uncovered card.", "success");
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
    this.onboarding?.recordJobCompleted?.("waste");
    document.querySelector("#waste-campaign-gameplay")?.classList.add("hidden");
    document.querySelector("#waste-campaign-result")?.classList.remove("hidden");
    setText("#waste-result-title", "Park restored!");
    setText("#waste-result-message", result.firstClear ? "All rubbish matched and saved." : "All rubbish matched. Your best result is safe.");
    setText("#waste-result-coins", `+${result.rewardCoins}`);
    this.setCampaignMessage("Level saved.", "success");
    this.renderCampaign();
  }

  setCampaignMessage(message, status = "neutral") {
    const element = document.querySelector("#waste-campaign-status");
    if (element) { element.textContent = message; element.dataset.status = status; }
  }

  startTownJobPresentation() {
    this.job = this.cleanup.getJob(this.session.targetId);
    if (!this.job) { this.returnToTown(false); return; }
    this.backdropTitle?.setText(`WASTE COLLECTION · ${this.job.title.toUpperCase()}`);
    this.campaignHud?.classList.add("hidden");
    this.townHud = document.querySelector("#cleanup-hud");
    this.townHud?.classList.remove("hidden");
    setText("#cleanup-status", `Pick up ${this.job.items.length} pieces.`);
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
    setText("#cleanup-status", count === total ? "Everything is collected." : `${total - count} pieces left.`);
    const finish = document.querySelector("#cleanup-finish"); if (finish) { finish.disabled = count !== total; finish.classList.toggle("hidden", count !== total); }
    for (const button of document.querySelectorAll("[data-cleanup-item]")) { const done = this.collected.has(button.dataset.cleanupItem); button.disabled = done; button.classList.toggle("collected", done); }
    this.updateDomState();
  }

  finishTownJob() {
    if (this.collected.size !== this.job.items.length) return false;
    const result = this.cleanup.complete(this.session.id, { collectedItemIds: [...this.collected] });
    if (!result.ok) { setText("#cleanup-status", result.message); return false; }
    this.onboarding?.recordJobCompleted?.("waste");
    setText("#cleanup-result-coins", `+${result.rewardCoins}`); setText("#cleanup-result-balance", result.balance);
    const panel = document.querySelector("#cleanup-result"); panel?.classList.remove("hidden"); panel?.setAttribute("aria-hidden", "false");
    return true;
  }

  requestExit() {
    if (this.session?.mode === "town-job") return this.returnToTown(false);
    if (this.session?.mode === "campaign" && this.session.moves > 0 && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000;
      if (this.exitButton) this.exitButton.textContent = "Confirm Exit";
      this.setCampaignMessage("Tap Confirm Exit to leave this attempt.", "error");
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
    const badge = document.querySelector(".milestone-badge"); if (badge) badge.textContent = "WASTE COLLECTION";
    setText("#location-status", this.session?.mode === "town-job" ? this.job?.title : "Waste Collection Campaign");
    setText("#control-hint", "Tap uncovered cards · match three · H shows a safe card · landscape play");
    setText("#landscape-required-message", "Waste Collection is designed for landscape play. Turn your phone sideways to continue matching rubbish.");
  }

  updateDomState() {
    if (!import.meta.env.DEV) return;
    const game = document.querySelector("#game"); if (!game) return;
    const active = this.cleanup?.getActiveSession(); const diagnostics = this.cleanup?.getDiagnostics();
    game.dataset.scene = this.scene.key; game.dataset.wasteMode = active?.mode || (this.lastCampaignResult ? "result" : "loading");
    game.dataset.wasteLevel = String(active?.assignedLevel || this.lastCampaignResult?.level || diagnostics?.wasteProgress?.nextLevel || 1);
    game.dataset.wasteRemaining = String(active?.mode === "campaign" ? this.cleanup.getCampaignSessionState()?.remaining : this.job ? this.job.items.length - this.collected.size : 0);
    game.dataset.wasteCompleted = String(diagnostics?.wasteProgress?.completed || 0); game.dataset.wasteCatalogue = String(diagnostics?.totalLevels || 0);
    game.dataset.wasteCatalogueValid = String(Boolean(diagnostics?.catalogueValid));
    game.dataset.wasteTrayLimit = String(wasteCollectionTrayLimit(this.gameState.getSnapshot()));
  }

  shutdownScene() {
    this.exitButton?.removeEventListener("click", this.onExit);
    this.boardElement?.removeEventListener("click", this.onBoardClick); this.buttons?.hint?.removeEventListener("click", this.onHint); this.buttons?.retry?.removeEventListener("click", this.onRetry); this.buttons?.qa?.removeEventListener("click", this.onQa);
    this.buttons?.return?.removeEventListener("click", this.onReturn);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("resize", this.onViewportResize);
    this.boardResizeObserver?.disconnect();
    if (this.layoutFrame !== null) cancelAnimationFrame(this.layoutFrame);
    for (const node of this.flightNodes || []) node.remove();
    this.flightNodes?.clear();
    const list = document.querySelector("#cleanup-item-list"); list?.removeEventListener("click", this.onTownItem);
    document.querySelector("#cleanup-finish")?.removeEventListener("click", this.onTownFinish); document.querySelector("#cleanup-exit")?.removeEventListener("click", this.onTownExit); document.querySelector("#cleanup-result-return")?.removeEventListener("click", this.onTownResult);
    this.campaignHud?.classList.add("hidden"); this.townHud?.classList.add("hidden"); document.querySelector("#cleanup-result")?.classList.add("hidden");
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return { scene: this.scene.key, gameplayConnected: true, portraitSupported: false, landscapeRequiredOnMobile: true, ...this.cleanup.getDiagnostics(), session: this.cleanup.getActiveSession(), campaignState: this.cleanup.getCampaignSessionState(), legacySaveUntouched: true };
  }
}
