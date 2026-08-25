import Phaser from "phaser";
import { CAFE_APPLIANCES, CAFE_RECIPES, cafeStep } from "../data/cafe.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class CafeScene extends Phaser.Scene {
  constructor() { super("CafeScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.exitArmedUntil = 0;
    this.station = null;
    this.lastTickResult = null;
    this.renderElapsed = 0;
  }

  create() {
    this.cafe = this.registry.get("cafe");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "cafe";
    this.timingScale = this.qaMode ? 0.12 : 1;
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawInterior();
    this.bindInterface();
    this.setSceneInterface();
    this.render();
    this.cameras.main.fadeIn(220, 41, 31, 25);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x9db7a0);
    const art = this.add.graphics();
    art.fillStyle(0x6f8e72, 1); art.fillRect(0, 0, 500, ROOM.height);
    art.fillStyle(0xc49463, 1); art.fillRect(500, 0, 390, ROOM.height);
    art.fillStyle(0x789aa0, 1); art.fillRect(890, 0, 390, ROOM.height);
    art.lineStyle(7, 0x292238, 1); art.lineBetween(500, 0, 500, ROOM.height); art.lineBetween(890, 0, 890, ROOM.height);
    art.fillStyle(0x292238, 1); art.fillRect(0, 0, ROOM.width, 68);
    for (const [x, y] of [[105, 190], [350, 190], [105, 465], [350, 465]]) {
      art.fillStyle(0x8a5b45, 1); art.fillRoundedRect(x - 64, y - 44, 128, 88, 14);
      art.fillStyle(0xf5e2b9, 1); art.fillCircle(x, y, 17);
      art.fillStyle(0x55546a, 1); art.fillRect(x - 5, y - 17, 10, 25);
    }
    art.fillStyle(0x9b6547, 1); art.fillRoundedRect(535, 120, 320, 185, 13); art.fillRoundedRect(535, 385, 320, 210, 13);
    art.fillStyle(0xe4cc9b, 1); art.fillRoundedRect(560, 415, 270, 145, 10);
    for (const x of [945, 1040, 1135, 1230]) {
      art.fillStyle(0xa9b8b7, 1); art.fillRoundedRect(x - 34, 155, 68, 82, 8);
    }
    this.add.text(28, 24, "CORNER CAFÉ · DINING ROOM", { color: "#fff1c9", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold" }).setDepth(5);
    this.add.text(535, 24, "ORDER COUNTER & THREE PREP TRAYS", { color: "#fff1c9", fontFamily: "ui-monospace, monospace", fontSize: "16px", fontStyle: "bold" }).setDepth(5);
    this.add.text(915, 24, "CAFÉ KITCHEN", { color: "#fff1c9", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold" }).setDepth(5);
    this.customerVisual = this.add.text(250, 330, "🧑  ☕  🧑", { fontSize: "48px", backgroundColor: "#fff1c9", padding: { x: 16, y: 10 }, color: "#292238" }).setOrigin(0.5).setDepth(6);
    this.prepVisual = this.add.text(695, 485, "☕  ① ② ③", { fontSize: "52px" }).setOrigin(0.5).setDepth(6);
    this.chefVisual = this.add.text(1080, 505, "🧑‍🍳", { fontSize: "78px" }).setOrigin(0.5).setDepth(6);
  }

  bindInterface() {
    this.hud = document.querySelector("#cafe-hud");
    this.levelSelect = document.querySelector("#cafe-level-select");
    this.startButton = document.querySelector("#cafe-start");
    this.exitButton = document.querySelector("#cafe-exit");
    this.undoButton = document.querySelector("#cafe-undo");
    this.discardButton = document.querySelector("#cafe-discard");
    this.serveButton = document.querySelector("#cafe-serve");
    this.nextButton = document.querySelector("#cafe-next");
    this.replayButton = document.querySelector("#cafe-replay");
    this.returnButton = document.querySelector("#cafe-return");
    this.stepList = document.querySelector("#cafe-step-list");
    this.orderList = document.querySelector("#cafe-orders");
    this.trayList = document.querySelector("#cafe-trays");
    document.querySelector("#cafe-picker")?.classList.remove("hidden");
    document.querySelector("#cafe-shift")?.classList.add("hidden");
    document.querySelector("#cafe-result")?.classList.add("hidden");
    if (this.exitButton) this.exitButton.textContent = "Exit café";
    this.setMessage("Choose an available café level to begin.", "neutral");
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Open for Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.requestExit();
    this.onUndo = () => { const result = this.cafe.undoStep(); this.setMessage(result.ok ? `${cafeStep(result.removed).name} removed.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.onDiscard = () => { const result = this.cafe.discardTray(); this.setMessage(result.ok ? "This tray was cleared. The customer is still waiting." : result.message, result.ok ? "error" : "neutral"); this.render(); };
    this.onServe = () => this.serveActive();
    this.onNext = () => this.startLevel(Math.min(150, (this.cafe.getActiveSession()?.level.level || 1) + 1));
    this.onReplay = () => this.startLevel(this.cafe.getActiveSession()?.level.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onSteps = (event) => { const button = event.target.closest?.("[data-cafe-step]"); if (button) this.useStep(button.dataset.cafeStep); };
    this.onTrays = (event) => { const button = event.target.closest?.("[data-cafe-tray]"); if (button && !this.station) { const result = this.cafe.selectTray(Number(button.dataset.cafeTray)); this.setMessage(result.ok ? `Prep ${Number(button.dataset.cafeTray) + 1} selected for ${result.order.customerName}.` : result.message, result.ok ? "neutral" : "error"); this.render(); } };
    this.onOrders = (event) => { const button = event.target.closest?.("[data-cafe-order-tray]"); if (button && !this.station) { this.cafe.selectTray(Number(button.dataset.cafeOrderTray)); this.render(); } };
    this.startButton?.addEventListener("click", this.onStart); this.levelSelect?.addEventListener("change", this.onLevelChange); this.exitButton?.addEventListener("click", this.onExit);
    this.undoButton?.addEventListener("click", this.onUndo); this.discardButton?.addEventListener("click", this.onDiscard);
    this.serveButton?.addEventListener("click", this.onServe); this.nextButton?.addEventListener("click", this.onNext);
    this.replayButton?.addEventListener("click", this.onReplay); this.returnButton?.addEventListener("click", this.onReturn);
    this.stepList?.addEventListener("click", this.onSteps); this.trayList?.addEventListener("click", this.onTrays); this.orderList?.addEventListener("click", this.onOrders);
    this.onKeyDown = (event) => { if (event.key === "Escape") this.requestExit(); };
    window.addEventListener("keydown", this.onKeyDown);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    if (badge) badge.textContent = "CORNER CAFÉ · MILESTONE 14";
    const status = document.querySelector("#location-status"); if (status) status.textContent = "Inside Corner Café";
    const hint = document.querySelector("#control-hint"); if (hint) hint.textContent = "Choose a prep tray · Follow highlighted steps · Escape exits safely";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Corner Café is designed for landscape play. Turn your phone sideways to continue this shift.";
  }

  startLevel(level) {
    if (this.cafe.getActiveSession()) this.cafe.cancel();
    this.lastTickResult = null; this.renderElapsed = 0; this.station = null;
    const result = this.cafe.startLevel(level, { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down", instantOrders: this.qaMode });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#cafe-picker")?.classList.add("hidden");
    document.querySelector("#cafe-shift")?.classList.remove("hidden");
    document.querySelector("#cafe-result")?.classList.add("hidden");
    this.setMessage("Choose a preparation tray, then follow the highlighted recipe sequence.", "success");
    this.render();
    return true;
  }

  useStep(stepId) {
    if (this.station && this.station.id !== stepId) return false;
    const definition = cafeStep(stepId);
    if (!definition) return false;
    if (CAFE_APPLIANCES[stepId]) {
      if (this.cafe.expectedStep() !== stepId) {
        const rejected = this.cafe.applyStep(stepId);
        this.setMessage(rejected.message, "error"); this.render(); return false;
      }
      if (this.station?.status === "ready") {
        this.station = null; this.chefVisual.setText("🧑‍🍳");
        return this.finishStep(stepId);
      }
      if (this.station) return false;
      this.station = { id: stepId, status: "working" };
      this.chefVisual.setText("🧑‍🍳💨");
      this.setMessage(`${definition.name} working… wait for Ready, then tap it again.`, "working");
      this.render();
      this.time.delayedCall(Math.max(90, definition.seconds * 1000 * this.timingScale), () => {
        if (this.transitioning || !this.station || this.station.id !== stepId) return;
        this.station.status = "ready";
        this.chefVisual.setText("🧑‍🍳✨");
        this.setMessage(`${definition.name} is ready—tap it again to return the preparation to its tray.`, "success");
        this.render();
      });
      return true;
    }
    return this.finishStep(stepId);
  }

  finishStep(stepId) {
    const result = this.cafe.applyStep(stepId);
    if (!result.ok) this.setMessage(result.message, "error");
    else if (result.complete) this.setMessage(`${result.recipe.name} is ready—finish the dish.`, "success");
    else this.setMessage(`${result.step.name} added. Next: ${cafeStep(result.expectedStep).name}.`, "neutral");
    this.render();
    return result.ok;
  }

  serveActive() {
    if (this.station) return false;
    const result = this.cafe.serveActive();
    if (!result.ok) { this.setMessage(result.message, "error"); this.render(); return false; }
    if (result.result) { this.showResult(result.result); return true; }
    if (result.code === "dish-added") this.setMessage(`${result.message} Now prepare ${result.nextRecipe.name}.`, "success");
    else this.setMessage(`${result.customerName} loved the order! The next occupied tray is ready.`, "success");
    this.render();
    return true;
  }

  showResult(result) {
    document.querySelector("#cafe-shift")?.classList.add("hidden"); document.querySelector("#cafe-result")?.classList.remove("hidden");
    document.querySelector("#cafe-result-title").textContent = result.won ? "Shift complete!" : "Shift needs another try";
    document.querySelector("#cafe-result-stars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
    document.querySelector("#cafe-result-message").textContent = result.won ? result.firstClear ? "Every customer was served. The next café level is unlocked." : "Best score saved. Replay coins are first-clear only." : result.failureReason || "A customer left before their order was ready.";
    document.querySelector("#cafe-result-accuracy").textContent = `${result.accuracy}%`; document.querySelector("#cafe-result-happiness").textContent = `${result.happiness}%`;
    document.querySelector("#cafe-result-waste").textContent = String(result.waste); document.querySelector("#cafe-result-coins").textContent = `+${result.coins}`;
    if (this.nextButton) this.nextButton.disabled = !result.won || this.cafe.getActiveSession().level.level >= 150;
    this.setMessage(result.won ? "Café shift complete." : result.failureReason, result.won ? "success" : "error");
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#cafe-status");
    if (element) { element.textContent = message || "Continue the café shift."; element.dataset.status = status; }
  }

  render() {
    const progress = this.cafe.getSnapshot(); const session = this.cafe.getActiveSession();
    if (this.levelSelect) {
      const previous = Number(this.levelSelect.value || progress.unlockedLevel);
      this.levelSelect.innerHTML = Array.from({ length: progress.unlockedLevel }, (_, index) => { const level = index + 1; const best = progress.best[level]; return `<option value="${level}">Level ${level}${best ? ` · ${"★".repeat(best.stars)}` : ""}</option>`; }).join("");
      this.levelSelect.value = String(Math.min(previous, progress.unlockedLevel));
    }
    document.querySelector("#cafe-progress-summary").textContent = `${Object.keys(progress.completed).length} cleared · ${progress.totalStars} stars · ${progress.lifetimeServed} served`;
    document.querySelector("#cafe-balance").textContent = `🪙 ${this.gameState.getSnapshot().economy.coins}`;
    if (!session) { this.updateDomState(); return; }
    const tray = session.trays[session.activeTray]; const order = tray?.orderId ? session.orders.find((candidate) => candidate.id === tray.orderId) : null;
    const recipe = order ? CAFE_RECIPES[order.recipes[tray.recipeIndex]] : null; const expected = recipe?.steps?.[tray.stepIndex] || null;
    document.querySelector("#cafe-level-name").textContent = `Level ${session.level.level} · ${session.level.name}`;
    document.querySelector("#cafe-queue-label").textContent = `${session.activeOrderIds.length} seated · no misses allowed`;
    document.querySelector("#cafe-served").textContent = `${session.served} / ${session.level.target}`;
    const remaining = Math.max(0, session.level.duration - session.elapsed); document.querySelector("#cafe-timer").textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    if (this.orderList) this.orderList.innerHTML = session.activeOrderIds.map((id) => { const customer = session.orders.find((candidate) => candidate.id === id); const trayIndex = session.trays.findIndex((candidate) => candidate.orderId === id); const ratio = Math.max(0, Math.round(customer.patience / customer.maxPatience * 100)); return `<button type="button" data-cafe-order-tray="${trayIndex}" class="${trayIndex === session.activeTray ? "active" : ""}"><strong>${customer.customerName}</strong><small>${customer.recipes.map((recipeId) => CAFE_RECIPES[recipeId].icon).join(" ")} · ${ratio}% patience</small></button>`; }).join("");
    if (this.trayList) this.trayList.innerHTML = session.trays.map((candidate) => { const customer = candidate.orderId ? session.orders.find((entry) => entry.id === candidate.orderId) : null; const item = customer ? CAFE_RECIPES[customer.recipes[candidate.recipeIndex]] : null; return `<button type="button" data-cafe-tray="${candidate.index}" class="${candidate.index === session.activeTray ? "active" : ""}" ${customer ? "" : "disabled"}><small>PREP ${candidate.index + 1}</small><strong>${customer?.customerName || "Free tray"}</strong><span>${item ? `${item.icon} ${item.name}` : "Waiting…"}</span></button>`; }).join("");
    document.querySelector("#cafe-order-name").textContent = recipe ? `${recipe.icon} ${recipe.name}` : "Waiting for an order";
    const sequence = document.querySelector("#cafe-recipe-sequence");
    if (sequence) sequence.innerHTML = recipe ? recipe.steps.map((step, index) => `<span class="${index < tray.stepIndex ? "done" : index === tray.stepIndex ? "next" : ""}">${cafeStep(step).icon}<small>${cafeStep(step).name}</small></span>`).join("") : "";
    const availableIds = [...new Set(session.level.menu.flatMap((id) => CAFE_RECIPES[id].steps))];
    availableIds.sort((a, b) => a === expected ? -1 : b === expected ? 1 : (CAFE_APPLIANCES[a] ? 1 : 0) - (CAFE_APPLIANCES[b] ? 1 : 0));
    if (this.stepList) this.stepList.innerHTML = availableIds.map((id) => { const item = cafeStep(id); const station = Boolean(CAFE_APPLIANCES[id]); const stationState = this.station?.id === id ? this.station.status : ""; return `<button type="button" data-cafe-step="${id}" class="${id === expected ? "next" : ""} ${station ? "station" : "ingredient"} ${stationState}" ${this.station && this.station.id !== id ? "disabled" : ""}><span>${item.icon}</span><strong>${item.name}</strong><small>${stationState === "working" ? "Working…" : stationState === "ready" ? "Ready · tap" : station ? "Station" : "Ingredient"}</small></button>`; }).join("");
    if (this.undoButton) this.undoButton.disabled = Boolean(this.station) || !tray?.orderId || tray.stepIndex < 1;
    if (this.discardButton) this.discardButton.disabled = Boolean(this.station) || !tray?.orderId || (tray.stepIndex < 1 && tray.completedRecipes.length < 1);
    if (this.serveButton) { this.serveButton.disabled = Boolean(this.station) || !recipe || Boolean(expected); this.serveButton.textContent = tray?.recipeIndex < (order?.recipes.length || 0) - 1 ? "Finish dish" : "Serve customer"; }
    this.customerVisual.setText(session.activeOrderIds.length ? `🧑 × ${session.activeOrderIds.length}  →  ☕` : "😊  ✓");
    this.prepVisual.setText(recipe ? expected ? cafeStep(expected).icon : recipe.icon : "✨");
    this.updateDomState();
  }

  updateDomState() {
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.cafe.getActiveSession(); const diagnostics = this.cafe.getDiagnostics();
    game.dataset.scene = this.scene.key; game.dataset.cafeLevel = String(session?.level.level || diagnostics.unlockedLevel);
    game.dataset.cafePhase = session?.finished ? "result" : session ? this.station?.status || "playing" : "picker";
    game.dataset.cafeExpectedStep = this.cafe.expectedStep() || "none"; game.dataset.cafeServed = String(session?.served || 0);
    game.dataset.cafeActiveOrders = String(session?.activeOrderIds.length || 0); game.dataset.cafeUnlocked = String(diagnostics.unlockedLevel); game.dataset.cafeCompleted = String(diagnostics.completedLevels);
  }

  renderLiveMetrics() {
    const session = this.cafe.getActiveSession();
    if (!session || session.finished) return;
    const remaining = Math.max(0, session.level.duration - session.elapsed);
    const timer = document.querySelector("#cafe-timer");
    if (timer) timer.textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    const orderButtons = this.orderList?.querySelectorAll("[data-cafe-order-tray]") || [];
    session.activeOrderIds.forEach((id, index) => {
      const order = session.orders.find((candidate) => candidate.id === id);
      const summary = orderButtons[index]?.querySelector("small");
      if (!order || !summary) return;
      const ratio = Math.max(0, Math.round(order.patience / order.maxPatience * 100));
      summary.textContent = `${order.recipes.map((recipeId) => CAFE_RECIPES[recipeId].icon).join(" ")} · ${ratio}% patience`;
    });
    this.updateDomState();
  }

  update(_time, delta) {
    const session = this.cafe.getActiveSession();
    if (session && !session.finished && !this.transitioning) {
      const result = this.cafe.tick(delta / 1000);
      if (result?.result && !this.lastTickResult) { this.lastTickResult = result.result; this.showResult(result.result); }
      else {
        this.renderElapsed += delta;
        if (result?.spawned) { this.renderElapsed = 0; this.render(); }
        else if (this.renderElapsed >= 100) { this.renderElapsed = 0; this.renderLiveMetrics(); }
      }
    }
  }

  requestExit() {
    const session = this.cafe.getActiveSession();
    if (session && !session.finished && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000; if (this.exitButton) this.exitButton.textContent = "Confirm exit shift";
      this.setMessage("Press Confirm exit shift within three seconds to abandon only this attempt.", "error"); return false;
    }
    return this.returnToTown(false);
  }

  returnToTown(complete) {
    if (this.transitioning) return false;
    this.transitioning = true; const session = this.cafe.getActiveSession(); if (session) this.cafe.cancel();
    const returnPosition = session?.returnPosition || this.entryData.returnPosition; const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition?.x, y: returnPosition?.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "cafe-complete" : "leaving-cafe");
    this.cameras.main.fadeOut(220, 41, 31, 25);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.exitButton?.removeEventListener("click", this.onExit);
    this.undoButton?.removeEventListener("click", this.onUndo); this.discardButton?.removeEventListener("click", this.onDiscard);
    this.serveButton?.removeEventListener("click", this.onServe); this.nextButton?.removeEventListener("click", this.onNext);
    this.replayButton?.removeEventListener("click", this.onReplay); this.returnButton?.removeEventListener("click", this.onReturn);
    this.stepList?.removeEventListener("click", this.onSteps); this.trayList?.removeEventListener("click", this.onTrays); this.orderList?.removeEventListener("click", this.onOrders);
    window.removeEventListener("keydown", this.onKeyDown); this.hud?.classList.add("hidden"); this.cafe?.cancel?.();
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }
}
