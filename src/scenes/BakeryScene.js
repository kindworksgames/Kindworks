import Phaser from "phaser";
import { BAKERY_APPLIANCES, BAKERY_RECIPES, bakeryStep } from "../data/bakery.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class BakeryScene extends Phaser.Scene {
  constructor() { super("BakeryScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.exitArmedUntil = 0;
    this.stationBusy = false;
    this.lastTickResult = null;
    this.renderElapsed = 0;
  }

  create() {
    this.bakery = this.registry.get("bakery");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "bakery";
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
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x8eb4b5);
    const art = this.add.graphics();
    art.fillStyle(0x4d5a61, 1); art.fillRect(0, 0, 360, ROOM.height);
    art.fillStyle(0xb97650, 1); art.fillRect(360, 0, 420, ROOM.height);
    art.fillStyle(0x86b7bd, 1); art.fillRect(780, 0, 500, ROOM.height);
    art.lineStyle(7, 0x292238, 1); art.lineBetween(360, 0, 360, ROOM.height); art.lineBetween(780, 0, 780, ROOM.height);
    art.fillStyle(0x9b6044, 1); art.fillRoundedRect(390, 110, 360, 165, 12); art.fillRoundedRect(390, 350, 360, 230, 12);
    art.fillStyle(0xd9c394, 1); art.fillRoundedRect(410, 380, 320, 170, 10);
    art.fillStyle(0xae704e, 1); art.fillRoundedRect(820, 120, 410, 190, 12); art.fillRoundedRect(820, 390, 410, 210, 12);
    art.fillStyle(0x292238, 1); art.fillRect(0, 0, ROOM.width, 68);
    for (const [x, y] of [[95, 210], [255, 210], [95, 465], [255, 465]]) {
      art.fillStyle(0x8f563f, 1); art.fillRoundedRect(x - 54, y - 38, 108, 76, 12);
      art.fillStyle(0xf4dfb2, 1); art.fillCircle(x, y, 15);
    }
    for (const [x, icon] of [[870, "⚙️"], [965, "🤲"], [1060, "↔️"], [1155, "▣"]]) {
      art.fillStyle(0x9aaeb2, 1); art.fillRoundedRect(x - 38, 155, 76, 84, 8);
      this.add.text(x, 197, icon, { fontSize: "32px" }).setOrigin(0.5).setDepth(4);
    }
    this.add.text(28, 24, "LITTLE BAKERY · CUSTOMER TABLES", { color: "#fff1c9", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold" }).setDepth(5);
    this.add.text(405, 24, "ORDER COUNTER & PREP BENCH", { color: "#fff1c9", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold" }).setDepth(5);
    this.add.text(815, 24, "BAKERY KITCHEN", { color: "#fff1c9", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold" }).setDepth(5);
    this.customerVisual = this.add.text(180, 330, "🧑  →  🥐", { fontSize: "54px", backgroundColor: "#fff1c9", padding: { x: 16, y: 10 }, color: "#292238" }).setOrigin(0.5).setDepth(6);
    this.prepVisual = this.add.text(570, 465, "🥣", { fontSize: "66px" }).setOrigin(0.5).setDepth(6);
    this.bakerVisual = this.add.text(1030, 520, "🧑‍🍳", { fontSize: "78px" }).setOrigin(0.5).setDepth(6);
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
    document.querySelector("#bakery-picker")?.classList.remove("hidden");
    document.querySelector("#bakery-shift")?.classList.add("hidden");
    document.querySelector("#bakery-result")?.classList.add("hidden");
    if (this.exitButton) this.exitButton.textContent = "Exit bakery";
    this.setMessage("Choose an available bakery level to begin.", "neutral");
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onExit = () => this.requestExit();
    this.onUndo = () => { const result = this.bakery.undoStep(); this.setMessage(result.ok ? `${bakeryStep(result.removed).name} removed.` : result.message, result.ok ? "neutral" : "error"); this.render(); };
    this.onDiscard = () => { const result = this.bakery.discardRecipe(); this.setMessage(result.ok ? "Preparation discarded. The customer is still waiting." : result.message, result.ok ? "error" : "neutral"); this.render(); };
    this.onServe = () => this.serveCurrentRecipe();
    this.onNext = () => this.startLevel(Math.min(150, (this.bakery.getActiveSession()?.level.level || 1) + 1));
    this.onReplay = () => this.startLevel(this.bakery.getActiveSession()?.level.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onSteps = (event) => { const button = event.target.closest?.("[data-bakery-step]"); if (button) this.useStep(button.dataset.bakeryStep); };
    this.startButton?.addEventListener("click", this.onStart);
    this.exitButton?.addEventListener("click", this.onExit);
    this.undoButton?.addEventListener("click", this.onUndo);
    this.discardButton?.addEventListener("click", this.onDiscard);
    this.serveButton?.addEventListener("click", this.onServe);
    this.nextButton?.addEventListener("click", this.onNext);
    this.replayButton?.addEventListener("click", this.onReplay);
    this.returnButton?.addEventListener("click", this.onReturn);
    this.stepList?.addEventListener("click", this.onSteps);
    this.onKeyDown = (event) => { if (event.key === "Escape") this.requestExit(); };
    window.addEventListener("keydown", this.onKeyDown);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const status = document.querySelector("#location-status");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = "LITTLE BAKERY · MILESTONE 15";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Little Bakery is designed for landscape play. Turn your phone sideways to continue this shift.";
    if (status) status.textContent = "Inside Little Bakery";
    if (hint) hint.textContent = "Follow the highlighted recipe steps · Escape exits safely";
  }

  startLevel(level) {
    if (this.bakery.getActiveSession()) this.bakery.cancel();
    this.lastTickResult = null;
    this.renderElapsed = 0;
    this.stationBusy = false;
    const result = this.bakery.startLevel(level, { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down" });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#bakery-picker")?.classList.add("hidden");
    document.querySelector("#bakery-shift")?.classList.remove("hidden");
    document.querySelector("#bakery-result")?.classList.add("hidden");
    this.setMessage(`Welcome ${result.session.orders[0].customerName}. Follow the highlighted steps for their order.`, "success");
    this.render();
    return true;
  }

  useStep(stepId) {
    if (this.stationBusy) return false;
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
      this.bakerVisual.setText("🧑‍🍳💨");
      this.setMessage(`${definition.name} working…`, "working");
      this.render();
      this.time.delayedCall(Math.max(90, definition.seconds * 1000 * this.timingScale), () => {
        if (this.transitioning) return;
        this.stationBusy = false;
        this.bakerVisual.setText("🧑‍🍳");
        this.finishStep(stepId);
      });
      return true;
    }
    return this.finishStep(stepId);
  }

  finishStep(stepId) {
    const result = this.bakery.applyStep(stepId);
    if (!result.ok) this.setMessage(result.message, "error");
    else if (result.complete) this.setMessage(`${result.recipe.name} is ready—finish the dish.`, "success");
    else this.setMessage(`${result.step.name} added. Next: ${bakeryStep(result.expectedStep).name}.`, "neutral");
    this.render();
    return result.ok;
  }

  serveCurrentRecipe() {
    if (this.stationBusy) return false;
    const result = this.bakery.serveRecipe();
    if (!result.ok) { this.setMessage(result.message, "error"); this.render(); return false; }
    if (result.result) { this.showResult(result.result); return true; }
    if (result.code === "dish-added") this.setMessage(`${result.message} Now prepare ${result.nextRecipe.name}.`, "success");
    else this.setMessage(`${result.customerName} loved the order! ${result.nextCustomer} is ready next.`, "success");
    this.render();
    return true;
  }

  showResult(result) {
    document.querySelector("#bakery-shift")?.classList.add("hidden");
    document.querySelector("#bakery-result")?.classList.remove("hidden");
    document.querySelector("#bakery-result-title").textContent = result.won ? "Shift complete!" : "Shift needs another try";
    document.querySelector("#bakery-result-stars").textContent = `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`;
    document.querySelector("#bakery-result-message").textContent = result.won ? result.firstClear ? "Every customer was served. The next bakery level is unlocked." : "Best score saved. Replay coins are first-clear only." : result.failureReason || "A customer left before their order was ready.";
    document.querySelector("#bakery-result-accuracy").textContent = `${result.accuracy}%`;
    document.querySelector("#bakery-result-happiness").textContent = `${result.happiness}%`;
    document.querySelector("#bakery-result-waste").textContent = String(result.waste);
    document.querySelector("#bakery-result-coins").textContent = `+${result.coins}`;
    this.setMessage(result.won ? "Bakery shift complete." : result.failureReason, result.won ? "success" : "error");
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
    if (!session) { this.updateDomState(); return; }
    const order = this.bakery.currentOrder();
    const recipe = this.bakery.currentRecipe();
    const expected = this.bakery.expectedStep();
    document.querySelector("#bakery-level-name").textContent = `Level ${session.level.level} · ${session.level.name}`;
    document.querySelector("#bakery-customer-name").textContent = order?.customerName || "All customers served";
    document.querySelector("#bakery-order-name").textContent = recipe ? `${recipe.icon} ${recipe.name}` : "Order complete";
    document.querySelector("#bakery-served").textContent = `${session.served} / ${session.level.target}`;
    const remaining = Math.max(0, session.level.duration - session.elapsed);
    document.querySelector("#bakery-timer").textContent = `${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
    const patience = order ? Math.max(0, Math.round(session.currentPatience / order.maxPatience * 100)) : 100;
    const meter = document.querySelector("#bakery-patience"); if (meter) meter.value = patience;
    document.querySelector("#bakery-patience-label").textContent = `${patience}% patience`;
    const sequence = document.querySelector("#bakery-recipe-sequence");
    if (sequence && recipe) sequence.innerHTML = recipe.steps.map((step, index) => `<span class="${index < session.stepIndex ? "done" : index === session.stepIndex ? "next" : ""}">${bakeryStep(step).icon}<small>${bakeryStep(step).name}</small></span>`).join("");
    const availableIds = [...new Set(session.level.menu.flatMap((id) => BAKERY_RECIPES[id].steps))];
    availableIds.sort((a, b) => a === expected ? -1 : b === expected ? 1 : (BAKERY_APPLIANCES[a] ? 1 : 0) - (BAKERY_APPLIANCES[b] ? 1 : 0));
    if (this.stepList) this.stepList.innerHTML = availableIds.map((id) => { const item = bakeryStep(id); const station = Boolean(BAKERY_APPLIANCES[id]); return `<button type="button" data-bakery-step="${id}" class="${id === expected ? "next" : ""} ${station ? "station" : "ingredient"}" ${this.stationBusy ? "disabled" : ""}><span>${item.icon}</span><strong>${item.name}</strong><small>${station ? "Station" : "Ingredient"}</small></button>`; }).join("");
    if (this.undoButton) this.undoButton.disabled = this.stationBusy || session.stepIndex < 1;
    if (this.discardButton) this.discardButton.disabled = this.stationBusy || session.stepIndex < 1;
    if (this.serveButton) { this.serveButton.disabled = this.stationBusy || Boolean(expected); this.serveButton.textContent = session.recipeIndex < (order?.recipes.length || 0) - 1 ? "Finish dish" : "Serve customer"; }
    this.customerVisual.setText(order && recipe ? `🧑  →  ${recipe.icon}` : "😊  ✓");
    this.prepVisual.setText(recipe ? expected ? bakeryStep(expected).icon : recipe.icon : "✨");
    this.updateDomState();
  }

  requestExit() {
    const session = this.bakery.getActiveSession();
    if (session && !session.finished && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000;
      if (this.exitButton) this.exitButton.textContent = "Confirm exit shift";
      this.setMessage("Press Confirm exit shift within three seconds to abandon only this attempt.", "error");
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
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.bakery.getActiveSession(); const diagnostics = this.bakery.getDiagnostics();
    game.dataset.scene = this.scene.key;
    game.dataset.bakeryLevel = String(session?.level.level || diagnostics.unlockedLevel);
    game.dataset.bakeryPhase = session?.finished ? "result" : session ? this.stationBusy ? "working" : "playing" : "picker";
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
      else if (!this.stationBusy) {
        this.renderElapsed += delta;
        if (this.renderElapsed >= 100) { this.renderElapsed = 0; this.render(); }
      }
    }
  }

  shutdownScene() {
    this.startButton?.removeEventListener("click", this.onStart); this.exitButton?.removeEventListener("click", this.onExit);
    this.undoButton?.removeEventListener("click", this.onUndo); this.discardButton?.removeEventListener("click", this.onDiscard);
    this.serveButton?.removeEventListener("click", this.onServe); this.nextButton?.removeEventListener("click", this.onNext);
    this.replayButton?.removeEventListener("click", this.onReplay); this.returnButton?.removeEventListener("click", this.onReturn);
    this.stepList?.removeEventListener("click", this.onSteps); window.removeEventListener("keydown", this.onKeyDown);
    this.hud?.classList.add("hidden"); this.bakery?.cancel?.();
    this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() { return { scene: this.scene.key, gameplayConnected: true, ...this.bakery.getDiagnostics(), session: this.bakery.getActiveSession(), legacySaveUntouched: true }; }
}
