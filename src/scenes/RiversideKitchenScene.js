import Phaser from "phaser";
import {
  RIVERSIDE_KITCHEN_APPLIANCES,
  RIVERSIDE_KITCHEN_CONFIG,
  RIVERSIDE_KITCHEN_RECIPES,
  riversideKitchenStep,
} from "../data/riversideKitchen.js";
import { createRestaurantPresentation, updateRestaurantPresentation } from "../ui/RestaurantPresentation.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class RiversideKitchenScene extends Phaser.Scene {
  constructor() { super("RiversideKitchenScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.lastTickResult = null;
    this.renderElapsed = 0;
  }

  create() {
    this.riversideKitchen = this.registry.get("riversideKitchen");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "riverside-kitchen";
    this.timingScale = this.qaMode ? 0.12 : 1;
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawInterior();
    this.bindInterface();
    this.setSceneInterface();
    const resumed = this.riversideKitchen.restorePersistedSession();
    if (resumed.ok) {
      document.querySelector("#riverside-kitchen-picker")?.classList.add("hidden");
      document.querySelector("#riverside-kitchen-shift")?.classList.remove("hidden");
      if (this.hud) this.hud.dataset.riversideKitchenView = "shift";
      this.setMessage(`Level ${resumed.session.level.level} resumed.`, "success");
    }
    this.render();
    this.cameras.main.fadeIn(220, 58, 35, 28);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    createRestaurantPresentation(this, "riverside");
  }

  bindInterface() {
    this.hud = document.querySelector("#riverside-kitchen-hud");
    this.levelSelect = document.querySelector("#riverside-kitchen-level-select");
    this.startButton = document.querySelector("#riverside-kitchen-start");
    this.exitButton = document.querySelector("#riverside-kitchen-exit");
    this.undoButton = document.querySelector("#riverside-kitchen-undo");
    this.discardButton = document.querySelector("#riverside-kitchen-discard");
    this.serveButton = document.querySelector("#riverside-kitchen-serve");
    this.nextButton = document.querySelector("#riverside-kitchen-next");
    this.replayButton = document.querySelector("#riverside-kitchen-replay");
    this.returnButton = document.querySelector("#riverside-kitchen-return");
    this.stepList = document.querySelector("#riverside-kitchen-step-list");
    this.orderList = document.querySelector("#riverside-kitchen-orders");
    this.trayList = document.querySelector("#riverside-kitchen-trays");
    this.worktop = document.querySelector("#riverside-kitchen-shift .riverside-kitchen-worktop");
    this.controls = document.querySelector("#riverside-kitchen-shift .cafe-controls");
    document.querySelector("#riverside-kitchen-picker")?.classList.remove("hidden");
    document.querySelector("#riverside-kitchen-shift")?.classList.add("hidden");
    document.querySelector("#riverside-kitchen-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.riversideKitchenView = "picker";
    this.setMessage("Choose a restaurant shift.", "neutral");
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Open for Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.returnToTown(false);
    this.onUndo = () => { const result = this.riversideKitchen.undoStep(); this.setMessage(result.ok ? result.message || `${riversideKitchenStep(result.removed).name} removed.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.onDiscard = () => { const result = this.riversideKitchen.discardTray(); this.setMessage(result.ok ? "This meal tray was cleared. The diner is still waiting." : result.message, result.ok ? "error" : "neutral"); this.render(); };
    this.onServe = () => this.serveActive();
    this.onNext = () => this.startLevel(Math.min(RIVERSIDE_KITCHEN_CONFIG.levelCount, (this.riversideKitchen.getActiveSession()?.level.level || 1) + 1));
    this.onReplay = () => this.startLevel(this.riversideKitchen.getActiveSession()?.level.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onSteps = (event) => { const button = event.target.closest?.("[data-riverside-kitchen-step]"); if (button) this.useStep(button.dataset.riversideKitchenStep); };
    this.onTrays = (event) => { const button = event.target.closest?.("[data-riverside-kitchen-tray]"); if (button) { const result = this.riversideKitchen.selectTray(Number(button.dataset.riversideKitchenTray)); this.setMessage(result.ok ? `Meal tray ${Number(button.dataset.riversideKitchenTray) + 1} selected for ${result.order.customerName}.` : result.message, result.ok ? "neutral" : "error"); this.render(); } };
    this.onOrders = (event) => { const button = event.target.closest?.("[data-riverside-kitchen-order-tray]"); if (button) { this.riversideKitchen.selectTray(Number(button.dataset.riversideKitchenOrderTray)); this.render(); } };
    this.onKeyDown = (event) => { if (event.key === "Escape") this.returnToTown(false); };
    this.onPageHide = () => this.riversideKitchen.persistActiveSession();
    this.startButton?.addEventListener("click", this.onStart); this.levelSelect?.addEventListener("change", this.onLevelChange); this.exitButton?.addEventListener("click", this.onExit);
    this.undoButton?.addEventListener("click", this.onUndo); this.discardButton?.addEventListener("click", this.onDiscard); this.serveButton?.addEventListener("click", this.onServe);
    this.nextButton?.addEventListener("click", this.onNext); this.replayButton?.addEventListener("click", this.onReplay); this.returnButton?.addEventListener("click", this.onReturn);
    this.stepList?.addEventListener("click", this.onSteps); this.trayList?.addEventListener("click", this.onTrays); this.orderList?.addEventListener("click", this.onOrders);
    window.addEventListener("keydown", this.onKeyDown); window.addEventListener("pagehide", this.onPageHide);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge"); if (badge) badge.textContent = "RIVERSIDE KITCHEN · MILESTONE 22";
    const status = document.querySelector("#location-status"); if (status) status.textContent = "Inside Riverside Kitchen";
    const hint = document.querySelector("#control-hint"); if (hint) hint.textContent = "Choose a meal tray · Follow preparation and heat steps · Save & exit preserves the shift";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Turn your device sideways to play.";
  }

  startLevel(level) {
    this.lastTickResult = null; this.renderElapsed = 0;
    const result = this.riversideKitchen.startLevel(level, { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down", instantOrders: this.qaMode });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#riverside-kitchen-picker")?.classList.add("hidden");
    document.querySelector("#riverside-kitchen-shift")?.classList.remove("hidden");
    document.querySelector("#riverside-kitchen-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.riversideKitchenView = "shift";
    this.setMessage("Choose a meal. Follow the highlight.", "success");
    this.render();
    return true;
  }

  useStep(stepId) {
    const definition = riversideKitchenStep(stepId);
    if (!definition) return false;
    if (RIVERSIDE_KITCHEN_APPLIANCES[stepId]) {
      const result = this.riversideKitchen.useAppliance(stepId, undefined, { durationScale: this.timingScale });
      if (result.code === "appliance-started") this.setMessage(`${definition.name} cooking on its own station.`, "working");
      else if (result.code === "appliance-collected") this.setMessage(result.complete ? `${result.recipe.name} is ready. Finish it.` : `${definition.name} returned to the tray.`, "success");
      else this.setMessage(result.message, result.code === "station-cooking" ? "working" : "error");
      this.render();
      return result.ok;
    }
    return this.finishStep(stepId);
  }

  finishStep(stepId) {
    const result = this.riversideKitchen.applyStep(stepId);
    if (!result.ok) this.setMessage(result.message, "error");
    else if (result.complete) this.setMessage(`${result.recipe.name} is ready. Finish it.`, "success");
    else this.setMessage(`Added ${result.step.name}. Next: ${riversideKitchenStep(result.expectedStep).name}.`, "neutral");
    this.render();
    return result.ok;
  }

  serveActive() {
    if (this.riversideKitchen.activeAppliance()) { this.setMessage("Collect or stop this tray's active station first.", "working"); return false; }
    const result = this.riversideKitchen.serveActive();
    if (!result.ok) { this.setMessage(result.message, "error"); this.render(); return false; }
    if (result.result) { this.showResult(result.result); return true; }
    if (result.code === "meal-added") this.setMessage(`Meal ready. Next: ${result.nextRecipe.name}.`, "success");
    else this.setMessage(`${result.customerName} served. Choose the next meal.`, "success");
    this.render();
    return true;
  }

  showResult(result) {
    document.querySelector("#riverside-kitchen-shift")?.classList.add("hidden"); document.querySelector("#riverside-kitchen-result")?.classList.remove("hidden");
    if (this.hud) this.hud.dataset.riversideKitchenView = "result";
    document.querySelector("#riverside-kitchen-result-title").textContent = result.won ? "Restaurant shift complete!" : "Shift needs another try";
    document.querySelector("#riverside-kitchen-result-stars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
    document.querySelector("#riverside-kitchen-result-message").textContent = result.won ? result.firstClear ? "All served. Next shift unlocked." : "Best score saved. Replay pays no coins." : result.failureReason || "A diner left. Try again.";
    document.querySelector("#riverside-kitchen-result-accuracy").textContent = `${result.accuracy}%`; document.querySelector("#riverside-kitchen-result-happiness").textContent = `${result.happiness}%`;
    document.querySelector("#riverside-kitchen-result-waste").textContent = String(result.waste); document.querySelector("#riverside-kitchen-result-coins").textContent = `+${result.coins}`;
    if (this.nextButton) {
      this.nextButton.disabled = !result.won || this.riversideKitchen.getActiveSession().level.level >= RIVERSIDE_KITCHEN_CONFIG.levelCount;
      this.nextButton.classList.toggle("hidden", !result.won);
    }
    this.setMessage(result.won ? `Shift complete. +${result.coins} coins.` : result.failureReason, result.won ? "success" : "error");
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#riverside-kitchen-status");
    if (element) { element.textContent = message || "Continue the Riverside Kitchen shift."; element.dataset.status = status; }
  }

  render() {
    const progress = this.riversideKitchen.getSnapshot(); const session = this.riversideKitchen.getActiveSession();
    if (this.levelSelect) {
      const previous = Number(this.levelSelect.value || progress.unlockedLevel);
      this.levelSelect.innerHTML = Array.from({ length: progress.unlockedLevel }, (_, index) => { const level = index + 1; const best = progress.best[level]; return `<option value="${level}">Level ${level}${best ? ` · ${"★".repeat(best.stars)}` : ""}</option>`; }).join("");
      this.levelSelect.value = String(Math.min(previous, progress.unlockedLevel));
    }
    document.querySelector("#riverside-kitchen-progress-summary").textContent = `${Object.keys(progress.completed).length} cleared · ${progress.totalStars} stars · ${progress.lifetimeServed} served`;
    document.querySelector("#riverside-kitchen-balance").textContent = `🪙 ${this.gameState.getSnapshot().economy.coins}`;
    const liveStars = document.querySelector("#riverside-kitchen-live-stars");
    const bestStars = session ? Number(progress.best[session.level.level]?.stars || 0) : 0;
    if (liveStars) { liveStars.textContent = `${"★".repeat(bestStars)}${"☆".repeat(3 - bestStars)}`; liveStars.setAttribute("aria-label", `Best rating: ${bestStars} of 3 stars`); }
    if (!session) { updateRestaurantPresentation(this); this.updateDomState(); return; }
    const tray = session.trays[session.activeTray]; const customerOrder = tray?.orderId ? session.orders.find((candidate) => candidate.id === tray.orderId) : null;
    const recipe = customerOrder ? RIVERSIDE_KITCHEN_RECIPES[customerOrder.recipes[tray.recipeIndex]] : null; const expected = recipe?.steps?.[tray.stepIndex] || null;
    document.querySelector("#riverside-kitchen-level-name").textContent = `Level ${session.level.level} · ${session.level.name}`;
    document.querySelector("#riverside-kitchen-queue-label").textContent = `${session.activeOrderIds.length} seated · no misses allowed`;
    document.querySelector("#riverside-kitchen-served").textContent = `${session.served} / ${session.level.target}`;
    const remaining = Math.max(0, session.level.duration - session.elapsed); document.querySelector("#riverside-kitchen-timer").textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    if (this.orderList) this.orderList.innerHTML = session.activeOrderIds.map((id) => { const customer = session.orders.find((candidate) => candidate.id === id); const trayIndex = session.trays.findIndex((candidate) => candidate.orderId === id); const ratio = Math.max(0, Math.round(customer.patience / customer.maxPatience * 100)); return `<button type="button" data-riverside-kitchen-order-tray="${trayIndex}" class="${trayIndex === session.activeTray ? "active" : ""}"><strong>${customer.customerName}</strong><small>${customer.recipes.map((recipeId) => RIVERSIDE_KITCHEN_RECIPES[recipeId].icon).join(" ")} · ${ratio}% patience</small></button>`; }).join("");
    if (this.trayList) this.trayList.innerHTML = session.trays.map((candidate) => { const customer = candidate.orderId ? session.orders.find((entry) => entry.id === candidate.orderId) : null; const item = customer ? RIVERSIDE_KITCHEN_RECIPES[customer.recipes[candidate.recipeIndex]] : null; const patience = customer ? Math.max(0, Math.round(customer.patience / customer.maxPatience * 100)) : 0; return `<button type="button" data-riverside-kitchen-tray="${candidate.index}" class="${candidate.index === session.activeTray ? "active" : ""}" ${customer ? "" : "disabled"}><small>MEAL ${candidate.index + 1}</small><strong>${customer?.customerName || "Free tray"}</strong><span>${item ? `${item.icon} ${item.name} · ${patience}%` : "Waiting…"}</span></button>`; }).join("");
    document.querySelector("#riverside-kitchen-order-name").textContent = recipe ? `${recipe.icon} ${recipe.name}` : "Waiting for an order";
    const sequence = document.querySelector("#riverside-kitchen-recipe-sequence");
    if (sequence) sequence.innerHTML = recipe ? recipe.steps.map((step, index) => `<span class="${index < tray.stepIndex ? "done" : index === tray.stepIndex ? "next" : ""}">${riversideKitchenStep(step).icon}<small>${riversideKitchenStep(step).name}</small></span>`).join("") : "";
    const availableIds = [...new Set(session.level.menu.flatMap((id) => RIVERSIDE_KITCHEN_RECIPES[id].steps))];
    availableIds.sort((a, b) => a === expected ? -1 : b === expected ? 1 : (RIVERSIDE_KITCHEN_APPLIANCES[a] ? 1 : 0) - (RIVERSIDE_KITCHEN_APPLIANCES[b] ? 1 : 0));
    if (this.stepList) this.stepList.innerHTML = availableIds.map((id) => { const item = riversideKitchenStep(id); const station = Boolean(RIVERSIDE_KITCHEN_APPLIANCES[id]); const stationState = session.appliances?.[id]?.status || "idle"; return `<button type="button" data-riverside-kitchen-step="${id}" data-asset-label="KW-RIVERSIDE-STEP-${id}" class="${id === expected ? "next" : ""} ${station ? "station" : "ingredient"} ${stationState}"><span>${item.icon}</span><strong>${item.name}</strong><small>${stationState === "cooking" ? "Cooking…" : stationState === "ready" ? "Ready · tap" : stationState === "burnt" ? "Burnt · clear" : station ? "Heat / station" : "Ingredient"}</small></button>`; }).join("");
    const activeAppliance = this.riversideKitchen.activeAppliance();
    const canRevise = Boolean(tray?.orderId) && Boolean(expected) && (tray.stepIndex > 0 || tray.completedRecipes.length > 0 || activeAppliance);
    if (this.undoButton) { this.undoButton.disabled = !canRevise || (!activeAppliance && tray.stepIndex < 1); this.undoButton.classList.toggle("hidden", !canRevise || (!activeAppliance && tray.stepIndex < 1)); }
    if (this.discardButton) { this.discardButton.disabled = !canRevise; this.discardButton.classList.toggle("hidden", !canRevise); }
    if (this.serveButton) {
      const canServe = !activeAppliance && Boolean(recipe) && !expected;
      this.serveButton.disabled = !canServe;
      this.serveButton.classList.toggle("hidden", !canServe);
      this.serveButton.textContent = tray?.recipeIndex < (customerOrder?.recipes.length || 0) - 1 ? "Finish meal" : "Serve";
    }
    this.worktop?.classList.toggle("hidden", !expected);
    this.controls?.classList.toggle("hidden", !canRevise && Boolean(expected));
    updateRestaurantPresentation(this, {
      orders: session.activeOrderIds.map((id) => session.orders.find((candidate) => candidate.id === id)).filter(Boolean).map((candidate) => ({
        icons: candidate.recipes.map((id) => RIVERSIDE_KITCHEN_RECIPES[id].icon).join(" "),
        patience: candidate.patience / candidate.maxPatience,
      })),
      trays: session.trays.map((candidate) => {
        const customer = candidate.orderId ? session.orders.find((entry) => entry.id === candidate.orderId) : null;
        const item = customer ? RIVERSIDE_KITCHEN_RECIPES[customer.recipes[candidate.recipeIndex]] : null;
        return { active: candidate.index === session.activeTray, icon: item?.icon || "" };
      }),
      workerState: activeAppliance?.status || "idle",
      expectedIcon: expected ? riversideKitchenStep(expected).icon : recipe?.icon,
      appliances: Object.values(session.appliances || {}).filter((appliance) => appliance.status !== "idle").map((appliance) => ({ ...appliance, icon: riversideKitchenStep(appliance.id).icon, name: riversideKitchenStep(appliance.id).name })),
    });
    this.updateDomState();
  }

  updateDomState() {
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.riversideKitchen.getActiveSession(); const diagnostics = this.riversideKitchen.getDiagnostics();
    game.dataset.scene = this.scene.key; game.dataset.riversideKitchenLevel = String(session?.level.level || diagnostics.unlockedLevel);
    game.dataset.riversideKitchenPhase = session?.finished ? "result" : session ? this.riversideKitchen.activeAppliance()?.status || "playing" : "picker";
    game.dataset.riversideKitchenExpectedStep = this.riversideKitchen.expectedStep() || "none"; game.dataset.riversideKitchenServed = String(session?.served || 0);
    game.dataset.riversideKitchenActiveOrders = String(session?.activeOrderIds.length || 0); game.dataset.riversideKitchenUnlocked = String(diagnostics.unlockedLevel); game.dataset.riversideKitchenCompleted = String(diagnostics.completedLevels);
    game.dataset.riversideKitchenResumable = String(diagnostics.resumableSession);
  }

  renderLiveMetrics() {
    const session = this.riversideKitchen.getActiveSession();
    if (!session || session.finished) return;
    const remaining = Math.max(0, session.level.duration - session.elapsed);
    const timer = document.querySelector("#riverside-kitchen-timer");
    if (timer) timer.textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    const orderButtons = this.orderList?.querySelectorAll("[data-riverside-kitchen-order-tray]") || [];
    session.activeOrderIds.forEach((id, index) => {
      const customerOrder = session.orders.find((candidate) => candidate.id === id);
      const summary = orderButtons[index]?.querySelector("small");
      if (!customerOrder || !summary) return;
      const ratio = Math.max(0, Math.round(customerOrder.patience / customerOrder.maxPatience * 100));
      summary.textContent = `${customerOrder.recipes.map((recipeId) => RIVERSIDE_KITCHEN_RECIPES[recipeId].icon).join(" ")} · ${ratio}% patience`;
    });
    const trayButtons = this.trayList?.querySelectorAll("[data-riverside-kitchen-tray]") || [];
    session.trays.forEach((tray, index) => {
      const customerOrder = tray.orderId ? session.orders.find((candidate) => candidate.id === tray.orderId) : null;
      const item = customerOrder ? RIVERSIDE_KITCHEN_RECIPES[customerOrder.recipes[tray.recipeIndex]] : null;
      const summary = trayButtons[index]?.querySelector("span");
      if (!customerOrder || !item || !summary) return;
      const ratio = Math.max(0, Math.round(customerOrder.patience / customerOrder.maxPatience * 100));
      summary.textContent = `${item.icon} ${item.name} · ${ratio}%`;
    });
    this.updateDomState();
  }

  update(_time, delta) {
    const session = this.riversideKitchen.getActiveSession();
    if (session && !session.finished && !this.transitioning) {
      const result = this.riversideKitchen.tick(delta / 1000);
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
    const session = this.riversideKitchen.getActiveSession();
    if (session && !session.finished) {
      const suspended = this.riversideKitchen.suspend();
      if (!suspended.ok) { this.setMessage(suspended.message, "error"); return false; }
    } else if (session?.finished) this.riversideKitchen.cancel();
    this.transitioning = true;
    const returnPosition = session?.returnPosition || this.entryData.returnPosition;
    const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition?.x, y: returnPosition?.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "riverside-kitchen-complete" : "leaving-riverside-kitchen");
    this.cameras.main.fadeOut(220, 58, 35, 28);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.exitButton?.removeEventListener("click", this.onExit);
    this.undoButton?.removeEventListener("click", this.onUndo); this.discardButton?.removeEventListener("click", this.onDiscard); this.serveButton?.removeEventListener("click", this.onServe);
    this.nextButton?.removeEventListener("click", this.onNext); this.replayButton?.removeEventListener("click", this.onReplay); this.returnButton?.removeEventListener("click", this.onReturn);
    this.stepList?.removeEventListener("click", this.onSteps); this.trayList?.removeEventListener("click", this.onTrays); this.orderList?.removeEventListener("click", this.onOrders);
    window.removeEventListener("keydown", this.onKeyDown); window.removeEventListener("pagehide", this.onPageHide); this.hud?.classList.add("hidden");
    if (this.riversideKitchen.getActiveSession() && !this.riversideKitchen.getActiveSession().finished) this.riversideKitchen.persistActiveSession();
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      milestone: 22,
      controls: { keyboard: true, touch: true, landscapeRequired: true },
      campaign: this.riversideKitchen.getDiagnostics(),
      session: this.riversideKitchen.getActiveSession(),
      saveResume: true,
      firstClearRewards: true,
      legacyImport: true,
      preparationAndHeat: true,
    };
  }
}
