import Phaser from "phaser";
import {
  MORNING_MUG_APPLIANCES,
  MORNING_MUG_CONFIG,
  MORNING_MUG_RECIPES,
  morningMugStep,
} from "../data/morningMug.js";
import { createRestaurantPresentation, updateRestaurantPresentation } from "../ui/RestaurantPresentation.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class MorningMugScene extends Phaser.Scene {
  constructor() { super("MorningMugScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.lastTickResult = null;
    this.renderElapsed = 0;
  }

  create() {
    this.morningMug = this.registry.get("morningMug");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "morning-mug";
    this.timingScale = this.qaMode ? 0.12 : 1;
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawInterior();
    this.bindInterface();
    this.setSceneInterface();
    const resumed = this.morningMug.restorePersistedSession();
    if (resumed.ok) {
      document.querySelector("#morning-mug-picker")?.classList.add("hidden");
      document.querySelector("#morning-mug-shift")?.classList.remove("hidden");
      if (this.hud) this.hud.dataset.morningMugView = "shift";
      this.setMessage(`Level ${resumed.session.level.level} resumed.`, "success");
    }
    this.render();
    this.cameras.main.fadeIn(220, 30, 52, 53);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    createRestaurantPresentation(this, "mug");
  }

  bindInterface() {
    this.hud = document.querySelector("#morning-mug-hud");
    this.levelSelect = document.querySelector("#morning-mug-level-select");
    this.startButton = document.querySelector("#morning-mug-start");
    this.exitButton = document.querySelector("#morning-mug-exit");
    this.undoButton = document.querySelector("#morning-mug-undo");
    this.discardButton = document.querySelector("#morning-mug-discard");
    this.serveButton = document.querySelector("#morning-mug-serve");
    this.nextButton = document.querySelector("#morning-mug-next");
    this.replayButton = document.querySelector("#morning-mug-replay");
    this.returnButton = document.querySelector("#morning-mug-return");
    this.stepList = document.querySelector("#morning-mug-step-list");
    this.orderList = document.querySelector("#morning-mug-orders");
    this.trayList = document.querySelector("#morning-mug-trays");
    this.worktop = document.querySelector("#morning-mug-shift .morning-mug-worktop");
    this.controls = document.querySelector("#morning-mug-shift .cafe-controls");
    document.querySelector("#morning-mug-picker")?.classList.remove("hidden");
    document.querySelector("#morning-mug-shift")?.classList.add("hidden");
    document.querySelector("#morning-mug-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.morningMugView = "picker";
    this.setMessage("Choose a coffee shift.", "neutral");
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Open for Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.returnToTown(false);
    this.onUndo = () => { const result = this.morningMug.undoStep(); this.setMessage(result.ok ? result.message || `${morningMugStep(result.removed).name} removed.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.onDiscard = () => { const result = this.morningMug.discardTray(); this.setMessage(result.ok ? "Drink cleared. Start again." : result.message, result.ok ? "error" : "neutral"); this.render(); };
    this.onServe = () => this.serveActive();
    this.onNext = () => this.startLevel(Math.min(MORNING_MUG_CONFIG.levelCount, (this.morningMug.getActiveSession()?.level.level || 1) + 1));
    this.onReplay = () => this.startLevel(this.morningMug.getActiveSession()?.level.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onSteps = (event) => { const button = event.target.closest?.("[data-morning-mug-step]"); if (button) this.useStep(button.dataset.morningMugStep); };
    this.onTrays = (event) => { const button = event.target.closest?.("[data-morning-mug-tray]"); if (button) { const result = this.morningMug.selectTray(Number(button.dataset.morningMugTray)); this.setMessage(result.ok ? `${result.order.customerName}'s drink selected.` : result.message, result.ok ? "neutral" : "error"); this.render(); } };
    this.onOrders = (event) => { const button = event.target.closest?.("[data-morning-mug-order-tray]"); if (button) { this.morningMug.selectTray(Number(button.dataset.morningMugOrderTray)); this.render(); } };
    this.onKeyDown = (event) => { if (event.key === "Escape") this.returnToTown(false); };
    this.onPageHide = () => this.morningMug.persistActiveSession();
    this.startButton?.addEventListener("click", this.onStart); this.levelSelect?.addEventListener("change", this.onLevelChange); this.exitButton?.addEventListener("click", this.onExit);
    this.undoButton?.addEventListener("click", this.onUndo); this.discardButton?.addEventListener("click", this.onDiscard); this.serveButton?.addEventListener("click", this.onServe);
    this.nextButton?.addEventListener("click", this.onNext); this.replayButton?.addEventListener("click", this.onReplay); this.returnButton?.addEventListener("click", this.onReturn);
    this.stepList?.addEventListener("click", this.onSteps); this.trayList?.addEventListener("click", this.onTrays); this.orderList?.addEventListener("click", this.onOrders);
    window.addEventListener("keydown", this.onKeyDown); window.addEventListener("pagehide", this.onPageHide);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge"); if (badge) badge.textContent = "MORNING MUG";
    const status = document.querySelector("#location-status"); if (status) status.textContent = "Inside Morning Mug Coffee";
    const hint = document.querySelector("#control-hint"); if (hint) hint.textContent = "Choose a drink tray · Follow highlighted steps · Save & exit preserves the shift";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Turn your device sideways to play.";
  }

  startLevel(level) {
    this.lastTickResult = null; this.renderElapsed = 0;
    const result = this.morningMug.startLevel(level, { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down", instantOrders: this.qaMode });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#morning-mug-picker")?.classList.add("hidden");
    document.querySelector("#morning-mug-shift")?.classList.remove("hidden");
    document.querySelector("#morning-mug-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.morningMugView = "shift";
    this.setMessage("Choose a drink. Follow the highlight.", "success");
    this.render();
    return true;
  }

  useStep(stepId) {
    const definition = morningMugStep(stepId);
    if (!definition) return false;
    if (MORNING_MUG_APPLIANCES[stepId]) {
      const result = this.morningMug.useAppliance(stepId, undefined, { durationScale: this.timingScale });
      if (result.code === "appliance-started") this.setMessage(`${definition.name} started on its own station.`, "working");
      else if (result.code === "appliance-collected") this.setMessage(result.complete ? `${result.recipe.name} is ready. Finish it.` : `${definition.name} returned to the tray.`, "success");
      else this.setMessage(result.message, result.code === "station-cooking" ? "working" : "error");
      this.render();
      return result.ok;
    }
    return this.finishStep(stepId);
  }

  finishStep(stepId) {
    const result = this.morningMug.applyStep(stepId);
    if (!result.ok) this.setMessage(result.message, "error");
    else if (result.complete) this.setMessage(`${result.recipe.name} is ready. Finish it.`, "success");
    else this.setMessage(`Added ${result.step.name}. Next: ${morningMugStep(result.expectedStep).name}.`, "neutral");
    this.render();
    return result.ok;
  }

  serveActive() {
    if (this.morningMug.activeAppliance()) { this.setMessage("Collect or stop this tray's active station first.", "working"); return false; }
    const result = this.morningMug.serveActive();
    if (!result.ok) { this.setMessage(result.message, "error"); this.render(); return false; }
    if (result.result) { this.showResult(result.result); return true; }
    if (result.code === "drink-added") this.setMessage(`Drink ready. Next: ${result.nextRecipe.name}.`, "success");
    else this.setMessage(`${result.customerName} served. Choose the next drink.`, "success");
    this.render();
    return true;
  }

  showResult(result) {
    document.querySelector("#morning-mug-shift")?.classList.add("hidden"); document.querySelector("#morning-mug-result")?.classList.remove("hidden");
    if (this.hud) this.hud.dataset.morningMugView = "result";
    document.querySelector("#morning-mug-result-title").textContent = result.won ? "Coffee shift complete!" : "Shift needs another try";
    document.querySelector("#morning-mug-result-stars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
    document.querySelector("#morning-mug-result-message").textContent = result.won ? result.firstClear ? "All served. Next shift unlocked." : "Best score saved. Replay pays no coins." : result.failureReason || "A customer left. Try again.";
    document.querySelector("#morning-mug-result-accuracy").textContent = `${result.accuracy}%`; document.querySelector("#morning-mug-result-happiness").textContent = `${result.happiness}%`;
    document.querySelector("#morning-mug-result-waste").textContent = String(result.waste); document.querySelector("#morning-mug-result-coins").textContent = `+${result.coins}`;
    if (this.nextButton) {
      this.nextButton.disabled = !result.won || this.morningMug.getActiveSession().level.level >= MORNING_MUG_CONFIG.levelCount;
      this.nextButton.classList.toggle("hidden", !result.won);
    }
    this.setMessage(result.won ? `Shift complete. +${result.coins} coins.` : result.failureReason, result.won ? "success" : "error");
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#morning-mug-status");
    if (element) { element.textContent = message || "Continue the Morning Mug shift."; element.dataset.status = status; }
  }

  render() {
    const progress = this.morningMug.getSnapshot(); const session = this.morningMug.getActiveSession();
    if (this.levelSelect) {
      const previous = Number(this.levelSelect.value || progress.unlockedLevel);
      this.levelSelect.innerHTML = Array.from({ length: progress.unlockedLevel }, (_, index) => { const level = index + 1; const best = progress.best[level]; return `<option value="${level}">Level ${level}${best ? ` · ${"★".repeat(best.stars)}` : ""}</option>`; }).join("");
      this.levelSelect.value = String(Math.min(previous, progress.unlockedLevel));
    }
    document.querySelector("#morning-mug-progress-summary").textContent = `${Object.keys(progress.completed).length} cleared · ${progress.totalStars} stars · ${progress.lifetimeServed} served`;
    document.querySelector("#morning-mug-balance").textContent = `🪙 ${this.gameState.getSnapshot().economy.coins}`;
    const liveStars = document.querySelector("#morning-mug-live-stars");
    const bestStars = session ? Number(progress.best[session.level.level]?.stars || 0) : 0;
    if (liveStars) { liveStars.textContent = `${"★".repeat(bestStars)}${"☆".repeat(3 - bestStars)}`; liveStars.setAttribute("aria-label", `Best rating: ${bestStars} of 3 stars`); }
    if (!session) { updateRestaurantPresentation(this); this.updateDomState(); return; }
    const tray = session.trays[session.activeTray]; const customerOrder = tray?.orderId ? session.orders.find((candidate) => candidate.id === tray.orderId) : null;
    const recipe = customerOrder ? MORNING_MUG_RECIPES[customerOrder.recipes[tray.recipeIndex]] : null; const expected = recipe?.steps?.[tray.stepIndex] || null;
    document.querySelector("#morning-mug-level-name").textContent = `Level ${session.level.level} · ${session.level.name}`;
    document.querySelector("#morning-mug-queue-label").textContent = `${session.activeOrderIds.length} seated · no misses allowed`;
    document.querySelector("#morning-mug-served").textContent = `${session.served} / ${session.level.target}`;
    const remaining = Math.max(0, session.level.duration - session.elapsed); document.querySelector("#morning-mug-timer").textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    if (this.orderList) this.orderList.innerHTML = session.activeOrderIds.map((id) => { const customer = session.orders.find((candidate) => candidate.id === id); const trayIndex = session.trays.findIndex((candidate) => candidate.orderId === id); const ratio = Math.max(0, Math.round(customer.patience / customer.maxPatience * 100)); return `<button type="button" data-morning-mug-order-tray="${trayIndex}" class="${trayIndex === session.activeTray ? "active" : ""}"><strong>${customer.customerName}</strong><small>${customer.recipes.map((recipeId) => MORNING_MUG_RECIPES[recipeId].icon).join(" ")} · ${ratio}% patience</small></button>`; }).join("");
    if (this.trayList) this.trayList.innerHTML = session.trays.map((candidate) => { const customer = candidate.orderId ? session.orders.find((entry) => entry.id === candidate.orderId) : null; const item = customer ? MORNING_MUG_RECIPES[customer.recipes[candidate.recipeIndex]] : null; const patience = customer ? Math.max(0, Math.round(customer.patience / customer.maxPatience * 100)) : 0; return `<button type="button" data-morning-mug-tray="${candidate.index}" class="${candidate.index === session.activeTray ? "active" : ""}" ${customer ? "" : "disabled"}><small>DRINK ${candidate.index + 1}</small><strong>${customer?.customerName || "Free tray"}</strong><span>${item ? `${item.icon} ${item.name} · ${patience}%` : "Waiting…"}</span></button>`; }).join("");
    document.querySelector("#morning-mug-order-name").textContent = recipe ? `${recipe.icon} ${recipe.name}` : "Waiting for an order";
    const sequence = document.querySelector("#morning-mug-recipe-sequence");
    if (sequence) sequence.innerHTML = recipe ? recipe.steps.map((step, index) => `<span class="${index < tray.stepIndex ? "done" : index === tray.stepIndex ? "next" : ""}">${morningMugStep(step).icon}<small>${morningMugStep(step).name}</small></span>`).join("") : "";
    const availableIds = [...new Set(session.level.menu.flatMap((id) => MORNING_MUG_RECIPES[id].steps))];
    availableIds.sort((a, b) => a === expected ? -1 : b === expected ? 1 : (MORNING_MUG_APPLIANCES[a] ? 1 : 0) - (MORNING_MUG_APPLIANCES[b] ? 1 : 0));
    if (this.stepList) this.stepList.innerHTML = availableIds.map((id) => { const item = morningMugStep(id); const station = Boolean(MORNING_MUG_APPLIANCES[id]); const stationState = session.appliances?.[id]?.status || "idle"; return `<button type="button" data-morning-mug-step="${id}" data-asset-label="KW-MUG-STEP-${id}" class="${id === expected ? "next" : ""} ${station ? "station" : "ingredient"} ${stationState}"><span>${item.icon}</span><strong>${item.name}</strong><small>${stationState === "cooking" ? "Working…" : stationState === "ready" ? "Ready · tap" : stationState === "burnt" ? "Burnt · clear" : station ? "Station" : "Ingredient"}</small></button>`; }).join("");
    const activeAppliance = this.morningMug.activeAppliance();
    const canRevise = Boolean(tray?.orderId) && Boolean(expected) && (tray.stepIndex > 0 || tray.completedRecipes.length > 0 || activeAppliance);
    if (this.undoButton) { this.undoButton.disabled = !canRevise || (!activeAppliance && tray.stepIndex < 1); this.undoButton.classList.toggle("hidden", !canRevise || (!activeAppliance && tray.stepIndex < 1)); }
    if (this.discardButton) { this.discardButton.disabled = !canRevise; this.discardButton.classList.toggle("hidden", !canRevise); }
    if (this.serveButton) {
      const canServe = !activeAppliance && Boolean(recipe) && !expected;
      this.serveButton.disabled = !canServe;
      this.serveButton.classList.toggle("hidden", !canServe);
      this.serveButton.textContent = tray?.recipeIndex < (customerOrder?.recipes.length || 0) - 1 ? "Finish drink" : "Serve";
    }
    this.worktop?.classList.toggle("hidden", !expected);
    this.controls?.classList.toggle("hidden", !canRevise && Boolean(expected));
    updateRestaurantPresentation(this, {
      orders: session.activeOrderIds.map((id) => session.orders.find((candidate) => candidate.id === id)).filter(Boolean).map((candidate) => ({
        icons: candidate.recipes.map((id) => MORNING_MUG_RECIPES[id].icon).join(" "),
        patience: candidate.patience / candidate.maxPatience,
      })),
      trays: session.trays.map((candidate) => {
        const customer = candidate.orderId ? session.orders.find((entry) => entry.id === candidate.orderId) : null;
        const item = customer ? MORNING_MUG_RECIPES[customer.recipes[candidate.recipeIndex]] : null;
        return { active: candidate.index === session.activeTray, icon: item?.icon || "" };
      }),
      workerState: activeAppliance?.status || "idle",
      expectedIcon: expected ? morningMugStep(expected).icon : recipe?.icon,
      appliances: Object.values(session.appliances || {}).filter((appliance) => appliance.status !== "idle").map((appliance) => ({ ...appliance, icon: morningMugStep(appliance.id).icon, name: morningMugStep(appliance.id).name })),
    });
    this.updateDomState();
  }

  updateDomState() {
    if (!import.meta.env.DEV) return;
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.morningMug.getActiveSession(); const diagnostics = this.morningMug.getDiagnostics();
    game.dataset.scene = this.scene.key; game.dataset.morningMugLevel = String(session?.level.level || diagnostics.unlockedLevel);
    game.dataset.morningMugPhase = session?.finished ? "result" : session ? this.morningMug.activeAppliance()?.status || "playing" : "picker";
    game.dataset.morningMugExpectedStep = this.morningMug.expectedStep() || "none"; game.dataset.morningMugServed = String(session?.served || 0);
    game.dataset.morningMugActiveOrders = String(session?.activeOrderIds.length || 0); game.dataset.morningMugUnlocked = String(diagnostics.unlockedLevel); game.dataset.morningMugCompleted = String(diagnostics.completedLevels);
    game.dataset.morningMugResumable = String(diagnostics.resumableSession);
  }

  renderLiveMetrics() {
    const session = this.morningMug.getActiveSession();
    if (!session || session.finished) return;
    const remaining = Math.max(0, session.level.duration - session.elapsed);
    const timer = document.querySelector("#morning-mug-timer");
    if (timer) timer.textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    const orderButtons = this.orderList?.querySelectorAll("[data-morning-mug-order-tray]") || [];
    session.activeOrderIds.forEach((id, index) => {
      const customerOrder = session.orders.find((candidate) => candidate.id === id);
      const summary = orderButtons[index]?.querySelector("small");
      if (!customerOrder || !summary) return;
      const ratio = Math.max(0, Math.round(customerOrder.patience / customerOrder.maxPatience * 100));
      summary.textContent = `${customerOrder.recipes.map((recipeId) => MORNING_MUG_RECIPES[recipeId].icon).join(" ")} · ${ratio}% patience`;
    });
    const trayButtons = this.trayList?.querySelectorAll("[data-morning-mug-tray]") || [];
    session.trays.forEach((tray, index) => {
      const customerOrder = tray.orderId ? session.orders.find((candidate) => candidate.id === tray.orderId) : null;
      const item = customerOrder ? MORNING_MUG_RECIPES[customerOrder.recipes[tray.recipeIndex]] : null;
      const summary = trayButtons[index]?.querySelector("span");
      if (!customerOrder || !item || !summary) return;
      const ratio = Math.max(0, Math.round(customerOrder.patience / customerOrder.maxPatience * 100));
      summary.textContent = `${item.icon} ${item.name} · ${ratio}%`;
    });
    this.updateDomState();
  }

  update(_time, delta) {
    const session = this.morningMug.getActiveSession();
    if (session && !session.finished && !this.transitioning) {
      const result = this.morningMug.tick(delta / 1000);
      if (result?.result && !this.lastTickResult) { this.lastTickResult = result.result; this.showResult(result.result); }
      else if (!result?.ok && result?.code === "persistence-failed") this.setMessage(result.message, "error");
      else {
        this.renderElapsed += delta;
        if (result?.spawned || result?.applianceChanges?.length) { this.renderElapsed = 0; this.render(); }
        else if (this.renderElapsed >= 100) { this.renderElapsed = 0; this.renderLiveMetrics(); }
      }
    }
  }

  returnToTown(complete) {
    if (this.transitioning) return false;
    const session = this.morningMug.getActiveSession();
    if (session && !session.finished) {
      const suspended = this.morningMug.suspend();
      if (!suspended.ok) { this.setMessage(suspended.message, "error"); return false; }
    } else if (session?.finished) this.morningMug.cancel();
    this.transitioning = true;
    const returnPosition = session?.returnPosition || this.entryData.returnPosition;
    const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition?.x, y: returnPosition?.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "morning-mug-complete" : "leaving-morning-mug");
    this.cameras.main.fadeOut(220, 30, 52, 53);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.exitButton?.removeEventListener("click", this.onExit);
    this.undoButton?.removeEventListener("click", this.onUndo); this.discardButton?.removeEventListener("click", this.onDiscard); this.serveButton?.removeEventListener("click", this.onServe);
    this.nextButton?.removeEventListener("click", this.onNext); this.replayButton?.removeEventListener("click", this.onReplay); this.returnButton?.removeEventListener("click", this.onReturn);
    this.stepList?.removeEventListener("click", this.onSteps); this.trayList?.removeEventListener("click", this.onTrays); this.orderList?.removeEventListener("click", this.onOrders);
    window.removeEventListener("keydown", this.onKeyDown); window.removeEventListener("pagehide", this.onPageHide); this.hud?.classList.add("hidden");
    if (this.morningMug.getActiveSession() && !this.morningMug.getActiveSession().finished) this.morningMug.persistActiveSession();
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      milestone: 21,
      controls: { keyboard: true, touch: true, landscapeRequired: true },
      campaign: this.morningMug.getDiagnostics(),
      session: this.morningMug.getActiveSession(),
      saveResume: true,
      firstClearRewards: true,
      legacyImport: true,
    };
  }
}
