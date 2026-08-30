import Phaser from "phaser";
import { BAKERY_APPLIANCES, BAKERY_RECIPES, bakeryStep } from "../data/bakery.js";
import { createRestaurantPresentation, updateRestaurantPresentation } from "../ui/RestaurantPresentation.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class BakeryScene extends Phaser.Scene {
  constructor() { super("BakeryScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.exitArmedUntil = 0;
    this.stationBusy = false;
    this.busyTrays = new Set();
    this.lastTickResult = null;
    this.renderElapsed = 0;
  }

  create() {
    this.bakery = this.registry.get("bakery");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    const qaRoute = new URLSearchParams(window.location.search).get("qa");
    this.qaMode = import.meta.env.DEV && ["bakery", "fidelity"].includes(qaRoute);
    this.fidelityQa = import.meta.env.DEV && qaRoute === "fidelity";
    this.timingScale = this.qaMode ? 0.12 : 1;
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawInterior();
    this.bindInterface();
    this.setSceneInterface();
    this.render();
    this.cameras.main.fadeIn(220, 58, 35, 25);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    createRestaurantPresentation(this, "bakery");
  }

  bindInterface() {
    this.hud = document.querySelector("#bakery-hud");
    this.levelSelect = document.querySelector("#bakery-level-select");
    this.startButton = document.querySelector("#bakery-start");
    this.exitButton = document.querySelector("#bakery-exit");
    this.undoButton = document.querySelector("#bakery-undo");
    this.discardButton = document.querySelector("#bakery-discard");
    this.serveButton = document.querySelector("#bakery-serve");
    this.nextButton = document.querySelector("#bakery-next");
    this.replayButton = document.querySelector("#bakery-replay");
    this.returnButton = document.querySelector("#bakery-return");
    this.stepList = document.querySelector("#bakery-step-list");
    this.ordersElement = document.querySelector("#bakery-orders");
    this.traysElement = document.querySelector("#bakery-trays");
    this.worktop = document.querySelector(".bakery-worktop");
    this.controls = document.querySelector(".bakery-controls");
    document.querySelector("#bakery-picker")?.classList.remove("hidden");
    document.querySelector("#bakery-shift")?.classList.add("hidden");
    document.querySelector("#bakery-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.bakeryView = "picker";
    if (this.exitButton) this.exitButton.textContent = "Exit";
    this.setMessage("Choose a bakery shift.", "neutral");
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Open for Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.requestExit();
    this.onUndo = () => { const result = this.bakery.undoStep(); this.setMessage(result.ok ? `${bakeryStep(result.removed).name} removed from this tray.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.onDiscard = () => { const result = this.bakery.discardRecipe(); this.setMessage(result.ok ? "This tray was cleared." : result.message, result.ok ? "error" : "neutral"); this.render(); };
    this.onServe = () => this.serveCurrentRecipe();
    this.onNext = () => this.startLevel(Math.min(150, (this.bakery.getActiveSession()?.level.level || 1) + 1));
    this.onReplay = () => this.startLevel(this.bakery.getActiveSession()?.level.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onSteps = (event) => { const button = event.target.closest?.("[data-bakery-step]"); if (button) this.useStep(button.dataset.bakeryStep); };
    this.onTraySelect = (event) => { const button = event.target.closest?.("[data-bakery-tray]"); if (!button) return; const result = this.bakery.selectTray(Number(button.dataset.bakeryTray)); this.setMessage(result.ok ? `${result.order.customerName}'s tray selected.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.startButton?.addEventListener("click", this.onStart);
    this.levelSelect?.addEventListener("change", this.onLevelChange);
    this.exitButton?.addEventListener("click", this.onExit);
    this.undoButton?.addEventListener("click", this.onUndo);
    this.discardButton?.addEventListener("click", this.onDiscard);
    this.serveButton?.addEventListener("click", this.onServe);
    this.nextButton?.addEventListener("click", this.onNext);
    this.replayButton?.addEventListener("click", this.onReplay);
    this.returnButton?.addEventListener("click", this.onReturn);
    this.stepList?.addEventListener("click", this.onSteps);
    this.ordersElement?.addEventListener("click", this.onTraySelect);
    this.traysElement?.addEventListener("click", this.onTraySelect);
    this.onKeyDown = (event) => { if (event.key === "Escape") this.requestExit(); };
    window.addEventListener("keydown", this.onKeyDown);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const status = document.querySelector("#location-status");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = "LITTLE BAKERY";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Turn your device sideways to play.";
    if (status) status.textContent = "Inside Little Bakery";
    if (hint) hint.textContent = "Follow the highlighted recipe steps · Escape exits safely";
  }

  startLevel(level) {
    if (this.bakery.getActiveSession()) this.bakery.cancel();
    this.lastTickResult = null;
    this.renderElapsed = 0;
    this.stationBusy = false;
    this.busyTrays.clear();
    const result = this.bakery.startLevel(level, {
      returnPosition: this.entryData.returnPosition,
      returnFacing: this.entryData.returnFacing || "down",
      instantOrders: this.fidelityQa,
    });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#bakery-picker")?.classList.add("hidden");
    document.querySelector("#bakery-shift")?.classList.remove("hidden");
    document.querySelector("#bakery-result")?.classList.add("hidden");
    if (this.hud) this.hud.dataset.bakeryView = "shift";
    if (this.exitButton) this.exitButton.textContent = "Exit";
    this.setMessage(`${result.session.orders[0].customerName} is ready. Follow the highlight.`, "success");
    this.render();
    return true;
  }

  useStep(stepId) {
    const trayIndex = this.bakery.getActiveSession()?.activeTray;
    if (!Number.isInteger(trayIndex) || this.busyTrays.has(trayIndex)) return false;
    const definition = bakeryStep(stepId);
    if (!definition) return false;
    if (BAKERY_APPLIANCES[stepId]) {
      const expected = this.bakery.expectedStep();
      if (expected !== stepId) {
        const rejected = this.bakery.applyStep(stepId);
        this.setMessage(rejected.message, "error");
        this.render();
        return false;
      }
      this.stationBusy = true;
      this.busyTrays.add(trayIndex);
      this.restaurantPresentation.workerTag.setText("WORKING…");
      this.setMessage(`${definition.name} working…`, "working");
      this.render();
      this.time.delayedCall(Math.max(90, definition.seconds * 1000 * this.timingScale), () => {
        if (this.transitioning) return;
        this.busyTrays.delete(trayIndex);
        this.stationBusy = this.busyTrays.size > 0;
        this.restaurantPresentation.workerTag.setText(this.stationBusy ? "WORKING…" : "READY");
        this.finishStep(stepId, trayIndex);
      });
      return true;
    }
    return this.finishStep(stepId, trayIndex);
  }

  finishStep(stepId, trayIndex = this.bakery.getActiveSession()?.activeTray) {
    const result = this.bakery.applyStep(stepId, trayIndex);
    if (!result.ok) this.setMessage(result.message, "error");
    else if (result.complete) this.setMessage(`${result.recipe.name} is ready. Finish it.`, "success");
    else this.setMessage(`Added ${result.step.name}. Next: ${bakeryStep(result.expectedStep).name}.`, "neutral");
    this.render();
    return result.ok;
  }

  serveCurrentRecipe() {
    const activeTray = this.bakery.getActiveSession()?.activeTray;
    if (this.busyTrays.has(activeTray)) return false;
    const result = this.bakery.serveRecipe();
    if (!result.ok) { this.setMessage(result.message, "error"); this.render(); return false; }
    if (result.result) { this.showResult(result.result); return true; }
    if (result.code === "dish-added") this.setMessage(`Dish ready. Next: ${result.nextRecipe.name}.`, "success");
    else this.setMessage(`${result.customerName} served. ${result.nextCustomer} is next.`, "success");
    this.render();
    return true;
  }

  showResult(result) {
    document.querySelector("#bakery-shift")?.classList.add("hidden");
    document.querySelector("#bakery-result")?.classList.remove("hidden");
    if (this.hud) this.hud.dataset.bakeryView = "result";
    document.querySelector("#bakery-result-title").textContent = result.won ? "Shift complete!" : "Shift needs another try";
    document.querySelector("#bakery-result-stars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
    document.querySelector("#bakery-result-message").textContent = result.won ? result.firstClear ? "All served. Next shift unlocked." : "Best score saved. Replay pays no coins." : result.failureReason || "A customer left. Try again.";
    document.querySelector("#bakery-result-accuracy").textContent = `${result.accuracy}%`;
    document.querySelector("#bakery-result-happiness").textContent = `${result.happiness}%`;
    document.querySelector("#bakery-result-waste").textContent = String(result.waste);
    document.querySelector("#bakery-result-coins").textContent = `+${result.coins}`;
    this.setMessage(result.won ? `Shift complete. +${result.coins} coins.` : result.failureReason, result.won ? "success" : "error");
    if (this.nextButton) this.nextButton.disabled = !result.won || this.bakery.getActiveSession().level.level >= 150;
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#bakery-status");
    if (element) { element.textContent = message || "Continue the bakery shift."; element.dataset.status = status; }
  }

  render() {
    const progress = this.bakery.getSnapshot();
    const session = this.bakery.getActiveSession();
    if (this.levelSelect) {
      const previous = Number(this.levelSelect.value || progress.unlockedLevel);
      this.levelSelect.innerHTML = Array.from({ length: progress.unlockedLevel }, (_, index) => { const level = index + 1; const best = progress.best[level]; return `<option value="${level}">Level ${level}${best ? ` · ${"★".repeat(best.stars)}` : ""}</option>`; }).join("");
      this.levelSelect.value = String(Math.min(previous, progress.unlockedLevel));
    }
    document.querySelector("#bakery-progress-summary").textContent = `${Object.keys(progress.completed).length} cleared · ${progress.totalStars} stars · ${progress.lifetimeServed} served`;
    document.querySelector("#bakery-balance").textContent = `🪙 ${this.gameState.getSnapshot().economy.coins}`;
    const liveStars = document.querySelector("#bakery-live-stars");
    const bestStars = session ? Number(progress.best[session.level.level]?.stars || 0) : 0;
    if (liveStars) { liveStars.textContent = `${"★".repeat(bestStars)}${"☆".repeat(3 - bestStars)}`; liveStars.setAttribute("aria-label", `Best rating: ${bestStars} of 3 stars`); }
    if (!session) { updateRestaurantPresentation(this); this.updateDomState(); return; }
    const order = this.bakery.currentOrder();
    const tray = this.bakery.tray();
    const recipe = this.bakery.currentRecipe();
    const expected = this.bakery.expectedStep();
    document.querySelector("#bakery-level-name").textContent = `Level ${session.level.level} · ${session.level.name}`;
    document.querySelector("#bakery-customer-name").textContent = order?.customerName || "All customers served";
    document.querySelector("#bakery-order-name").textContent = recipe ? `${recipe.icon} ${recipe.name}` : "Order complete";
    document.querySelector("#bakery-served").textContent = `${session.served} / ${session.level.target}`;
    const remaining = Math.max(0, session.level.duration - session.elapsed);
    document.querySelector("#bakery-timer").textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    const patience = order ? Math.max(0, Math.round(order.patience / order.maxPatience * 100)) : 100;
    const meter = document.querySelector("#bakery-patience"); if (meter) meter.value = patience;
    document.querySelector("#bakery-patience-label").textContent = `${patience}% patience`;
    const sequence = document.querySelector("#bakery-recipe-sequence");
    if (sequence) sequence.innerHTML = recipe ? recipe.steps.map((step, index) => `<span class="${index < tray.stepIndex ? "done" : index === tray.stepIndex ? "next" : ""}">${bakeryStep(step).icon}<small>${bakeryStep(step).name}</small></span>`).join("") : "";
    if (this.ordersElement) this.ordersElement.innerHTML = session.trays.map((candidate) => { const candidateOrder = this.bakery.orderForTray(candidate); if (!candidateOrder) return `<button type="button" disabled><strong>Next order</strong><small>Waiting…</small></button>`; const ratio = Math.max(0, Math.round(candidateOrder.patience / candidateOrder.maxPatience * 100)); return `<button type="button" data-bakery-tray="${candidate.index}" class="${candidate.index === session.activeTray ? "active" : ""}" aria-label="Select ${candidateOrder.customerName}'s order"><strong>${candidateOrder.customerName}</strong><small>${candidateOrder.recipes.map((id) => BAKERY_RECIPES[id].icon).join(" ")} · ${ratio}%</small></button>`; }).join("");
    if (this.traysElement) this.traysElement.innerHTML = session.trays.map((candidate) => { const candidateOrder = this.bakery.orderForTray(candidate); const candidateRecipe = this.bakery.currentRecipe(candidate); const busy = this.busyTrays.has(candidate.index); return `<button type="button" data-bakery-tray="${candidate.index}" class="${candidate.index === session.activeTray ? "active" : ""} ${busy ? "busy" : ""}" ${candidateOrder ? "" : "disabled"}><small>PREP ${candidate.index + 1}</small><strong>${candidateRecipe ? `${candidateRecipe.icon} ${candidateRecipe.name}` : "Available"}</strong><span>${candidate.completedRecipes.length} finished · ${candidate.stepIndex} steps</span></button>`; }).join("");
    const availableIds = [...new Set(session.level.menu.flatMap((id) => BAKERY_RECIPES[id].steps))];
    availableIds.sort((a, b) => a === expected ? -1 : b === expected ? 1 : (BAKERY_APPLIANCES[a] ? 1 : 0) - (BAKERY_APPLIANCES[b] ? 1 : 0));
    const activeBusy = this.busyTrays.has(session.activeTray);
    if (this.stepList) this.stepList.innerHTML = availableIds.map((id) => { const item = bakeryStep(id); const station = Boolean(BAKERY_APPLIANCES[id]); return `<button type="button" data-bakery-step="${id}" data-asset-label="KW-BAKERY-STEP-${id}" class="${id === expected ? "next" : ""} ${station ? "station" : "ingredient"}" ${activeBusy ? "disabled" : ""}><span>${item.icon}</span><strong>${item.name}</strong><small>${station ? "Station" : "Ingredient"}</small></button>`; }).join("");
    const canRevise = !activeBusy && Boolean(tray) && tray.stepIndex > 0 && Boolean(expected);
    if (this.undoButton) { this.undoButton.disabled = !canRevise; this.undoButton.classList.toggle("hidden", !canRevise); }
    if (this.discardButton) { this.discardButton.disabled = !canRevise; this.discardButton.classList.toggle("hidden", !canRevise); }
    if (this.serveButton) {
      const canServe = !activeBusy && !expected && Boolean(recipe);
      this.serveButton.disabled = !canServe;
      this.serveButton.classList.toggle("hidden", !canServe);
      this.serveButton.textContent = (tray?.recipeIndex || 0) < (order?.recipes.length || 0) - 1 ? "Finish dish" : "Serve";
    }
    this.worktop?.classList.toggle("hidden", !expected);
    this.controls?.classList.toggle("hidden", !canRevise && Boolean(expected));
    updateRestaurantPresentation(this, {
      orders: session.activeOrderIds.map((id) => session.orders.find((candidate) => candidate.id === id)).filter(Boolean).map((candidate) => ({
        icons: candidate.recipes.map((id) => BAKERY_RECIPES[id].icon).join(" "),
        patience: candidate.patience / candidate.maxPatience,
      })),
      trays: session.trays.map((candidate) => ({
        active: candidate.index === session.activeTray,
        icon: this.bakery.currentRecipe(candidate)?.icon || candidate.completedRecipes.map((id) => BAKERY_RECIPES[id]?.icon || "").join(""),
      })),
      workerState: this.stationBusy ? "working" : "idle",
      expectedIcon: expected ? bakeryStep(expected).icon : recipe?.icon,
    });
    this.updateDomState();
  }

  requestExit() {
    const session = this.bakery.getActiveSession();
    if (session && !session.finished && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000;
      if (this.exitButton) this.exitButton.textContent = "Confirm Exit";
      this.setMessage("Leave this shift? Tap Confirm Exit.", "error");
      return false;
    }
    return this.returnToTown(false);
  }

  returnToTown(complete) {
    if (this.transitioning) return false;
    this.transitioning = true;
    const session = this.bakery.getActiveSession();
    if (session) this.bakery.cancel();
    const returnPosition = session?.returnPosition || this.entryData.returnPosition;
    const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition?.x, y: returnPosition?.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "bakery-complete" : "leaving-bakery");
    this.cameras.main.fadeOut(220, 58, 35, 25);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  updateDomState() {
    if (!import.meta.env.DEV) return;
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.bakery.getActiveSession(); const diagnostics = this.bakery.getDiagnostics();
    game.dataset.scene = this.scene.key;
    game.dataset.bakeryLevel = String(session?.level.level || diagnostics.unlockedLevel);
    game.dataset.bakeryPhase = session?.finished ? "result" : session ? this.busyTrays.size ? "working" : "playing" : "picker";
    game.dataset.bakeryExpectedStep = this.bakery.expectedStep() || "none";
    game.dataset.bakeryServed = String(session?.served || 0);
    game.dataset.bakeryUnlocked = String(diagnostics.unlockedLevel);
    game.dataset.bakeryCompleted = String(diagnostics.completedLevels);
  }

  update(_time, delta) {
    const session = this.bakery.getActiveSession();
    if (session && !session.finished && !this.transitioning) {
      const result = this.bakery.tick(delta / 1000);
      if (result?.result && !this.lastTickResult) { this.lastTickResult = result.result; this.showResult(result.result); }
      else { this.renderElapsed += delta; if (this.renderElapsed >= 100) { this.renderElapsed = 0; this.render(); } }
    }
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.exitButton?.removeEventListener("click", this.onExit);
    this.undoButton?.removeEventListener("click", this.onUndo); this.discardButton?.removeEventListener("click", this.onDiscard);
    this.serveButton?.removeEventListener("click", this.onServe); this.nextButton?.removeEventListener("click", this.onNext);
    this.replayButton?.removeEventListener("click", this.onReplay); this.returnButton?.removeEventListener("click", this.onReturn);
    this.stepList?.removeEventListener("click", this.onSteps); window.removeEventListener("keydown", this.onKeyDown);
    this.ordersElement?.removeEventListener("click", this.onTraySelect); this.traysElement?.removeEventListener("click", this.onTraySelect);
    this.hud?.classList.add("hidden"); this.bakery?.cancel?.();
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() { return { scene: this.scene.key, gameplayConnected: true, ...this.bakery.getDiagnostics(), session: this.bakery.getActiveSession(), legacySaveUntouched: true }; }
}
