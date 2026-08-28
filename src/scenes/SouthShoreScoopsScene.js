import Phaser from "phaser";
import {
  SOUTH_SHORE_SCOOPS_CONFIG,
  SOUTH_SHORE_SCOOPS_PARTS,
  southShoreScoopsAvailableParts,
  southShoreScoopsOrderText,
  southShoreScoopsPart,
} from "../data/southShoreScoops.js";
import { animateScoopsDeparture, createScoopsPresentation, updateScoopsPresentation } from "../ui/RestaurantPresentation.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });
const PART_ORDER = Object.freeze(["cone", "waffle", "shavedCup", "sundaeCup", "cup", "drinkCup", "strawberry", "chocolate", "vanilla", "mint", "grape", "blueberry", "strawberrySauce", "chocolateSauce", "caramelSauce", "sprinkles", "chocBits", "marshmallows", "cherry", "milkshake", "lemonade", "shavedIce", "fruitSyrup", "lolly"]);

function partPicture(id) {
  const part = SOUTH_SHORE_SCOOPS_PARTS[id];
  if (!part) return "";
  return part.color
    ? `<i style="background:${part.color}" title="${part.name}"></i>`
    : `<span title="${part.name}">${part.icon}</span>`;
}

function productPicture(item, state = "") {
  if (!item) return "";
  return `<span class="scoops-product-picture ${state}" title="${item.name}" aria-label="${item.name}">${item.parts.map(partPicture).join("")}</span>`;
}

export class SouthShoreScoopsScene extends Phaser.Scene {
  constructor() { super("SouthShoreScoopsScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.lastTickResult = null;
    this.renderElapsed = 0;
  }

  create() {
    this.scoops = this.registry.get("southShoreScoops");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "scoops";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawCounter();
    this.bindInterface();
    this.setSceneInterface();
    const resumed = this.scoops.restorePersistedSession();
    if (resumed.ok) {
      document.querySelector("#south-shore-scoops-picker")?.classList.add("hidden");
      document.querySelector("#south-shore-scoops-shift")?.classList.remove("hidden");
      if (this.hud) this.hud.dataset.scoopsView = "shift";
      this.setMessage(`Level ${resumed.session.level.level} resumed.`, "success");
    }
    this.render();
    this.cameras.main.fadeIn(220, 40, 91, 103);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawCounter() {
    createScoopsPresentation(this);
  }

  bindInterface() {
    this.hud = document.querySelector("#south-shore-scoops-hud");
    this.levelSelect = document.querySelector("#south-shore-scoops-level-select");
    this.startButton = document.querySelector("#south-shore-scoops-start");
    this.exitButton = document.querySelector("#south-shore-scoops-exit");
    this.undoButton = document.querySelector("#south-shore-scoops-undo");
    this.discardButton = document.querySelector("#south-shore-scoops-discard");
    this.addTrayButton = document.querySelector("#south-shore-scoops-add-tray");
    this.serveButton = document.querySelector("#south-shore-scoops-serve");
    this.nextButton = document.querySelector("#south-shore-scoops-next");
    this.replayButton = document.querySelector("#south-shore-scoops-replay");
    this.returnButton = document.querySelector("#south-shore-scoops-return");
    this.partList = document.querySelector("#south-shore-scoops-parts");
    this.worktop = document.querySelector("#south-shore-scoops-shift .south-shore-scoops-worktop");
    this.controls = document.querySelector("#south-shore-scoops-shift .scoops-controls");
    document.querySelector("#south-shore-scoops-picker")?.classList.remove("hidden");
    document.querySelector("#south-shore-scoops-shift")?.classList.add("hidden");
    document.querySelector("#south-shore-scoops-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.scoopsView = "picker";
    this.setMessage("Choose a beach-counter shift.", "neutral");
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Open for Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.returnToTown(false);
    this.onUndo = () => { const result = this.scoops.undoPart(); this.setMessage(result.ok ? `${result.part.name} removed.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.onDiscard = () => { const result = this.scoops.discardPreparation(); this.setMessage(result.ok ? "Order cleared. Start again." : result.message, result.ok ? "error" : "neutral"); this.render(); };
    this.onAddTray = () => { const result = this.scoops.addCurrentToTray(); this.setMessage(result.ok ? "First item ready. Build the second." : result.message, result.ok ? "success" : "error"); this.render(); };
    this.onServe = () => this.serveCurrent();
    this.onNext = () => this.startLevel(Math.min(SOUTH_SHORE_SCOOPS_CONFIG.levelCount, (this.scoops.getActiveSession()?.level.level || 1) + 1));
    this.onReplay = () => this.startLevel(this.scoops.getActiveSession()?.level.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onParts = (event) => { const button = event.target.closest?.("[data-scoops-part]"); if (button) this.addPart(button.dataset.scoopsPart); };
    this.onKeyDown = (event) => { if (event.key === "Escape") this.returnToTown(false); };
    this.onPageHide = () => this.scoops.persistActiveSession();
    this.startButton?.addEventListener("click", this.onStart); this.levelSelect?.addEventListener("change", this.onLevelChange); this.exitButton?.addEventListener("click", this.onExit);
    this.undoButton?.addEventListener("click", this.onUndo); this.discardButton?.addEventListener("click", this.onDiscard); this.addTrayButton?.addEventListener("click", this.onAddTray); this.serveButton?.addEventListener("click", this.onServe);
    this.nextButton?.addEventListener("click", this.onNext); this.replayButton?.addEventListener("click", this.onReplay); this.returnButton?.addEventListener("click", this.onReturn); this.partList?.addEventListener("click", this.onParts);
    window.addEventListener("keydown", this.onKeyDown); window.addEventListener("pagehide", this.onPageHide);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge"); if (badge) badge.textContent = "SOUTH SHORE SCOOPS · MILESTONE 23";
    const status = document.querySelector("#location-status"); if (status) status.textContent = "Inside South Shore Scoops";
    const hint = document.querySelector("#control-hint"); if (hint) hint.textContent = "Match each picture · One customer served at a time · Save & exit preserves every part";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Turn your device sideways to play.";
  }

  startLevel(level) {
    this.lastTickResult = null;
    const result = this.scoops.startLevel(level, { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down" });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#south-shore-scoops-picker")?.classList.add("hidden");
    document.querySelector("#south-shore-scoops-shift")?.classList.remove("hidden");
    document.querySelector("#south-shore-scoops-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.scoopsView = "shift";
    this.setMessage("Match the picture, then serve.", "success");
    this.render();
    return true;
  }

  addPart(id) {
    const result = this.scoops.addPart(id);
    if (!result.ok) this.setMessage(result.message, "error");
    else this.setMessage(`${result.part.name} added${result.expectedPart ? ` · next ${southShoreScoopsPart(result.expectedPart).name}` : ""}.`, "neutral");
    this.render();
  }

  serveCurrent() {
    const result = this.scoops.serveCurrent();
    if (!result.ok) { this.setMessage(result.message, "error"); this.render(); return false; }
    this.transitioning = true;
    animateScoopsDeparture(this);
    this.setMessage(`${result.customerName} served — next customer is stepping forward.`, "success");
    this.time.delayedCall(360, () => {
      this.transitioning = false;
      if (result.result) this.showResult(result.result);
      else this.render();
    });
    return true;
  }

  showResult(result) {
    document.querySelector("#south-shore-scoops-shift")?.classList.add("hidden");
    document.querySelector("#south-shore-scoops-result")?.classList.remove("hidden");
    if (this.hud) this.hud.dataset.scoopsView = "result";
    document.querySelector("#south-shore-scoops-result-title").textContent = result.won ? "Beach-counter shift complete!" : "Try the shift again";
    document.querySelector("#south-shore-scoops-result-stars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
    document.querySelector("#south-shore-scoops-result-message").textContent = result.won ? result.firstClear ? `Next shift unlocked · shore tier ${result.restorationTier}.` : "Best score saved. Replay pays no coins." : "Match at least 60% of orders. Try again.";
    document.querySelector("#south-shore-scoops-result-accuracy").textContent = `${result.accuracy}%`;
    document.querySelector("#south-shore-scoops-result-happiness").textContent = `${result.happiness}%`;
    document.querySelector("#south-shore-scoops-result-waste").textContent = String(result.waste);
    document.querySelector("#south-shore-scoops-result-coins").textContent = `+${result.coins}`;
    if (this.nextButton) {
      this.nextButton.disabled = !result.won || this.scoops.getActiveSession().level.level >= SOUTH_SHORE_SCOOPS_CONFIG.levelCount;
      this.nextButton.classList.toggle("hidden", !result.won);
    }
    this.setMessage(result.won ? `Shift complete. +${result.coins} coins.` : "Below 60%. Try again.", result.won ? "success" : "error");
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#south-shore-scoops-status");
    if (element) { element.textContent = message || "Continue the South Shore Scoops shift."; element.dataset.status = status; }
  }

  render() {
    const progress = this.scoops.getSnapshot();
    const session = this.scoops.getActiveSession();
    if (this.levelSelect) {
      const previous = Number(this.levelSelect.value || progress.selectedLevel || progress.unlockedLevel);
      this.levelSelect.innerHTML = Array.from({ length: progress.unlockedLevel }, (_, index) => { const level = index + 1; const best = progress.best[level]; return `<option value="${level}">Level ${level}${best ? ` · ${"★".repeat(best.stars)} · ${best.accuracy}%` : ""}</option>`; }).join("");
      this.levelSelect.value = String(Math.min(previous, progress.unlockedLevel));
    }
    document.querySelector("#south-shore-scoops-progress-summary").textContent = `${Object.keys(progress.completed).length} cleared · ${progress.totalStars} stars · restoration tier ${progress.restorationTier}`;
    document.querySelector("#south-shore-scoops-balance").textContent = `🪙 ${this.gameState.getSnapshot().economy.coins}`;
    if (!session) { updateScoopsPresentation(this); this.updateDomState(); return; }
    const order = session.orders.find((candidate) => candidate.id === session.selectedOrderId) || null;
    const work = order ? session.work[order.id] : { build: [], tray: [] };
    const expectedItem = order?.items[work.tray.length] || null;
    document.querySelector("#south-shore-scoops-level-name").textContent = `Level ${session.level.level} · ${session.level.name}`;
    document.querySelector("#south-shore-scoops-queue-label").textContent = `${session.activeOrderIds.length} serving · ${this.scoops.previewOrders().length} next · 60% passes`;
    document.querySelector("#south-shore-scoops-served").textContent = `${session.served} / ${session.level.target}`;
    document.querySelector("#south-shore-scoops-score").textContent = String(session.score);
    const queue = this.scoops.visibleQueue();
    document.querySelector("#south-shore-scoops-customers").innerHTML = queue.map((customer, index) => `<div class="scoops-customer ${index === 0 ? "current" : "preview"}"><strong>${index === 0 ? "NOW · " : "NEXT · "}${customer.customerName}</strong><div class="scoops-mini-products">${customer.items.map((item) => item.parts.map((id) => SOUTH_SHORE_SCOOPS_PARTS[id].icon).join("")).join(" + ")}</div><small>${customer.items.map((item) => item.name).join(" + ")}</small></div>`).join("");
    document.querySelector("#south-shore-scoops-order-number").textContent = order ? `ORDER ${order.number}` : "WAITING";
    document.querySelector("#south-shore-scoops-customer-name").textContent = order?.customerName || "Customer";
    const patienceRatio = order ? Math.max(0, Math.min(1, order.patience / order.maxPatience)) : 0;
    const patience = document.querySelector("#south-shore-scoops-patience");
    if (patience) { patience.querySelector("span").style.width = `${Math.round(patienceRatio * 100)}%`; patience.classList.toggle("warn", patienceRatio > 0.2 && patienceRatio <= 0.45); patience.classList.toggle("danger", patienceRatio <= 0.2); }
    const orderPictures = document.querySelector("#south-shore-scoops-order-pictures");
    if (orderPictures) { orderPictures.innerHTML = order ? order.items.map((item, index) => productPicture(item, index < work.tray.length ? "done" : index === work.tray.length ? "current" : "")).join("") : ""; if (order) orderPictures.setAttribute("aria-label", southShoreScoopsOrderText(order)); }
    document.querySelector("#south-shore-scoops-build").innerHTML = work.build.length ? work.build.map(partPicture).join("") : "Start with the first picture";
    document.querySelector("#south-shore-scoops-tray").innerHTML = work.tray.length ? work.tray.map((parts) => parts.map(partPicture).join("")).join(" + ") : "No item ready";
    const expectedPart = this.scoops.nextExpectedPart();
    const guided = session.level.level <= 10;
    const available = southShoreScoopsAvailableParts(session.level.level).sort((left, right) => guided && left === expectedPart ? -1 : guided && right === expectedPart ? 1 : PART_ORDER.indexOf(left) - PART_ORDER.indexOf(right));
    if (this.partList) {
      this.partList.innerHTML = available.map((id) => { const part = southShoreScoopsPart(id); const guide = guided && id === expectedPart; return `<button type="button" data-scoops-part="${id}" class="${part.category} ${guide ? "next" : ""}" aria-label="Add ${part.name}">${part.color ? `<i style="background:${part.color}"></i>` : `<span>${part.icon}</span>`}<strong>${part.name}</strong><small>${part.category}</small></button>`; }).join("");
      if (guided) this.partList.scrollLeft = 0;
    }
    const canUndo = Boolean(work.build.length);
    const canDiscard = Boolean(work.build.length || work.tray.length);
    if (this.undoButton) { this.undoButton.disabled = !canUndo; this.undoButton.classList.toggle("hidden", !canUndo); }
    if (this.discardButton) { this.discardButton.disabled = !canDiscard; this.discardButton.classList.toggle("hidden", !canDiscard); }
    const hasMoreAfter = Boolean(order && work.tray.length < order.items.length - 1);
    const canAddTray = Boolean(work.build.length && hasMoreAfter);
    const canServe = Boolean(work.build.length && !hasMoreAfter);
    if (this.addTrayButton) { this.addTrayButton.disabled = !canAddTray; this.addTrayButton.classList.toggle("hidden", !canAddTray); }
    if (this.serveButton) { this.serveButton.disabled = !canServe; this.serveButton.classList.toggle("hidden", !canServe); this.serveButton.textContent = "Serve"; }
    this.controls?.classList.toggle("hidden", !canUndo && !canDiscard && !canAddTray && !canServe);
    updateScoopsPresentation(this, {
      customers: queue.map((customer) => ({ parts: customer.items[0]?.parts || [] })),
      buildParts: work.build,
      trayItems: work.tray,
      selectedParts: expectedItem?.parts || [],
    });
    this.updateDomState();
  }

  updateDomState() {
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.scoops.getActiveSession(); const diagnostics = this.scoops.getDiagnostics();
    game.dataset.scene = this.scene.key;
    game.dataset.scoopsLevel = String(session?.level.level || diagnostics.unlockedLevel);
    game.dataset.scoopsPhase = session?.finished ? "result" : session ? "playing" : "picker";
    game.dataset.scoopsExpectedPart = this.scoops.nextExpectedPart() || "none";
    game.dataset.scoopsServed = String(session?.served || 0);
    game.dataset.scoopsActiveCustomers = String(session?.activeOrderIds.length || 0);
    game.dataset.scoopsVisibleCustomers = String(session ? this.scoops.visibleQueue().length : 0);
    game.dataset.scoopsUnlocked = String(diagnostics.unlockedLevel);
    game.dataset.scoopsCompleted = String(diagnostics.completedLevels);
    game.dataset.scoopsRestorationTier = String(diagnostics.restorationTier);
    game.dataset.scoopsResumable = String(diagnostics.resumableSession);
  }

  renderLiveMetrics() {
    const session = this.scoops.getActiveSession();
    if (!session || session.finished) return;
    const order = session.orders.find((candidate) => candidate.id === session.selectedOrderId);
    if (!order) return;
    const ratio = Math.max(0, Math.min(1, order.patience / order.maxPatience));
    const patience = document.querySelector("#south-shore-scoops-patience");
    if (patience) { patience.querySelector("span").style.width = `${Math.round(ratio * 100)}%`; patience.classList.toggle("warn", ratio > 0.2 && ratio <= 0.45); patience.classList.toggle("danger", ratio <= 0.2); }
    this.updateDomState();
  }

  update(_time, delta) {
    const session = this.scoops.getActiveSession();
    if (session && !session.finished && !this.transitioning) {
      const result = this.scoops.tick(delta / 1000);
      if (result?.result && !this.lastTickResult) { this.lastTickResult = result.result; this.showResult(result.result); }
      else if (!result?.ok && result?.code === "persistence-failed") this.setMessage(result.message, "error");
      else {
        this.renderElapsed += delta;
        if (result?.missedCustomer) { this.renderElapsed = 0; this.setMessage(`${result.missedCustomer} left. Start the next order.`, "error"); this.render(); }
        else if (this.renderElapsed >= 100) { this.renderElapsed = 0; this.renderLiveMetrics(); }
      }
    }
  }

  returnToTown(complete) {
    if (this.transitioning) return false;
    const session = this.scoops.getActiveSession();
    if (session && !session.finished) {
      const suspended = this.scoops.suspend();
      if (!suspended.ok) { this.setMessage(suspended.message, "error"); return false; }
    } else if (session?.finished) this.scoops.cancel();
    this.transitioning = true;
    const returnPosition = session?.returnPosition || this.entryData.returnPosition;
    const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition?.x, y: returnPosition?.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "south-shore-scoops-complete" : "leaving-south-shore-scoops");
    this.cameras.main.fadeOut(220, 40, 91, 103);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.exitButton?.removeEventListener("click", this.onExit);
    this.undoButton?.removeEventListener("click", this.onUndo); this.discardButton?.removeEventListener("click", this.onDiscard); this.addTrayButton?.removeEventListener("click", this.onAddTray); this.serveButton?.removeEventListener("click", this.onServe);
    this.nextButton?.removeEventListener("click", this.onNext); this.replayButton?.removeEventListener("click", this.onReplay); this.returnButton?.removeEventListener("click", this.onReturn); this.partList?.removeEventListener("click", this.onParts);
    window.removeEventListener("keydown", this.onKeyDown); window.removeEventListener("pagehide", this.onPageHide); this.hud?.classList.add("hidden");
    if (this.scoops.getActiveSession() && !this.scoops.getActiveSession().finished) this.scoops.persistActiveSession();
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      milestone: 23,
      controls: { keyboard: true, touch: true, landscapeRequired: true },
      campaign: this.scoops.getDiagnostics(),
      session: this.scoops.getActiveSession(),
      deterministicShifts: 750,
      sequentialCustomerService: true,
      visibleCustomerQueue: 3,
      passingAccuracy: 60,
      saveResume: true,
      firstClearRewards: true,
      restorationEffects: true,
      legacyImport: true,
    };
  }
}
