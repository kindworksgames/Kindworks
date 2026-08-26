import Phaser from "phaser";
import {
  HOUSE_RESCUE_CATEGORIES,
  HOUSE_RESCUE_RULES,
  houseRescueCoverage,
  houseRescueLevel,
} from "../data/houseRescue.js";

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value);
}

export class HouseRescueScene extends Phaser.Scene {
  constructor() { super("HouseRescueScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.selectedItemId = null;
    this.lastVacuumRender = 0;
  }

  create() {
    this.houseRescue = this.registry.get("houseRescue");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "house-rescue";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawRoom();
    this.bindInterface();
    this.setSceneInterface();
    this.render();
    this.cameras.main.fadeIn(220, 53, 42, 35);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawRoom() {
    this.add.rectangle(640, 360, 1280, 720, 0xc9a978);
    const art = this.add.graphics();
    art.fillStyle(0x7e5d3e, 1); art.fillRect(70, 45, 1140, 620);
    art.fillStyle(0xf1dfb6, 1); art.fillRoundedRect(90, 65, 1100, 580, 18);
    art.lineStyle(3, 0xd3bb8a, 0.55);
    for (let x = 110; x < 1180; x += 54) art.lineBetween(x, 80, x, 630);
    art.fillStyle(0x895d42, 1); art.fillRoundedRect(100, 82, 230, 110, 12);
    art.fillStyle(0x789b70, 1); art.fillRoundedRect(940, 475, 220, 140, 16);
    art.fillStyle(0x547067, 1); art.fillRoundedRect(455, 70, 370, 65, 10);
    this.add.text(215, 137, "🛋️", { fontSize: "64px" }).setOrigin(0.5);
    this.add.text(1050, 530, "🛏️", { fontSize: "72px" }).setOrigin(0.5);
    this.add.text(640, 102, "🏠 HOUSE RESCUE · WILLOWMERE HOME TEAM", { color: "#fff7da", fontFamily: "ui-monospace, monospace", fontSize: "18px", fontStyle: "bold", stroke: "#493529", strokeThickness: 5 }).setOrigin(0.5);
  }

  bindInterface() {
    this.hud = document.querySelector("#house-rescue-hud");
    this.levelSelect = document.querySelector("#house-rescue-level-select");
    this.startButton = document.querySelector("#house-rescue-start");
    this.exitButton = document.querySelector("#house-rescue-exit");
    this.sortFloor = document.querySelector("#house-rescue-sort-floor");
    this.vacuumFloor = document.querySelector("#house-rescue-vacuum-floor");
    this.bins = document.querySelector("#house-rescue-bins");
    this.qaButton = document.querySelector("#house-rescue-qa-complete");
    this.resultButtons = {
      return: document.querySelector("#house-rescue-return"),
      next: document.querySelector("#house-rescue-next-home"),
    };
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onExit = () => this.returnToTown();
    this.onQa = () => this.completeQa();
    this.onReturn = () => this.returnToTown();
    this.onNextHome = () => this.returnToTown();
    this.onBinClick = (event) => {
      const button = event.target.closest("[data-house-rescue-bin]");
      if (!button || !this.selectedItemId) return;
      this.sortSelected(button.dataset.houseRescueBin);
    };
    this.onBinDragOver = (event) => { if (event.target.closest("[data-house-rescue-bin]")) event.preventDefault(); };
    this.onBinDrop = (event) => {
      const button = event.target.closest("[data-house-rescue-bin]");
      if (!button) return;
      event.preventDefault();
      this.selectedItemId = event.dataTransfer?.getData("text/plain") || this.selectedItemId;
      this.sortSelected(button.dataset.houseRescueBin);
    };
    this.onSortFloorClick = (event) => {
      const item = event.target.closest("[data-house-rescue-item]");
      if (!item) return;
      this.selectedItemId = item.dataset.houseRescueItem;
      this.render();
    };
    this.onSortDragStart = (event) => {
      const item = event.target.closest("[data-house-rescue-item]");
      if (!item) return;
      this.selectedItemId = item.dataset.houseRescueItem;
      event.dataTransfer?.setData("text/plain", this.selectedItemId);
    };
    this.onVacuumPointer = (event) => {
      const session = this.houseRescue.getActiveSession();
      if (!session || session.phase !== "vacuum") return;
      if (event.type === "pointerdown") {
        event.preventDefault();
        this.vacuumFloor?.setPointerCapture?.(event.pointerId);
        this.vacuumPointerId = event.pointerId;
      } else if (this.vacuumPointerId !== event.pointerId) return;
      const bounds = this.vacuumFloor.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) * 100;
      const y = (event.clientY - bounds.top) / Math.max(1, bounds.height) * 100;
      const result = this.houseRescue.moveVacuum(x, y);
      if (!result.ok) this.setMessage(result.message, "error");
      if (result.result) { this.vacuumPointerId = null; this.showResult(result.result); return; }
      const now = performance.now();
      if (now - this.lastVacuumRender > 90) { this.lastVacuumRender = now; this.render(); }
    };
    this.onVacuumPointerUp = (event) => {
      if (this.vacuumPointerId !== event.pointerId) return;
      this.vacuumFloor?.releasePointerCapture?.(event.pointerId);
      this.vacuumPointerId = null;
      this.render();
    };
    this.onKeyDown = (event) => this.handleKey(event);
    this.startButton?.addEventListener("click", this.onStart);
    this.exitButton?.addEventListener("click", this.onExit);
    this.qaButton?.addEventListener("click", this.onQa);
    this.resultButtons.return?.addEventListener("click", this.onReturn);
    this.resultButtons.next?.addEventListener("click", this.onNextHome);
    this.bins?.addEventListener("click", this.onBinClick);
    this.bins?.addEventListener("dragover", this.onBinDragOver);
    this.bins?.addEventListener("drop", this.onBinDrop);
    this.sortFloor?.addEventListener("click", this.onSortFloorClick);
    this.sortFloor?.addEventListener("dragstart", this.onSortDragStart);
    this.vacuumFloor?.addEventListener("pointerdown", this.onVacuumPointer);
    this.vacuumFloor?.addEventListener("pointermove", this.onVacuumPointer);
    this.vacuumFloor?.addEventListener("pointerup", this.onVacuumPointerUp);
    this.vacuumFloor?.addEventListener("pointercancel", this.onVacuumPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    this.qaButton?.classList.toggle("hidden", !this.qaMode);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    if (badge) badge.textContent = "HOUSE RESCUE · MILESTONE 16";
    setText("#location-status", "House Rescue");
    setText("#control-hint", "Sort: arrows + 1/2/3 · Vacuum: arrows or swipe · landscape play");
  }

  startLevel(level) {
    const result = this.houseRescue.startLevel(level, {
      houseId: this.entryData.houseId,
      returnPosition: this.entryData.returnPosition,
      returnFacing: this.entryData.returnFacing,
    });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#house-rescue-picker")?.classList.add("hidden");
    document.querySelector("#house-rescue-gameplay")?.classList.remove("hidden");
    document.querySelector("#house-rescue-result")?.classList.add("hidden");
    this.selectedItemId = null;
    this.setMessage(result.code === "house-rescue-resumed" ? "Your saved House Rescue has resumed safely." : "Sort each item into its matching bin. Correct sorts earn +2; mistakes cost 1 point.", "success");
    this.render();
    return true;
  }

  sortSelected(category) {
    if (!this.selectedItemId) return false;
    const result = this.houseRescue.sortItem(this.selectedItemId, category);
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    if (result.correct) {
      this.selectedItemId = null;
      this.setMessage(result.session.phase === "vacuum" ? "Sorting complete! Sweep the vacuum over at least 95% of all stain layers." : "+2 · Correctly sorted.", "success");
    } else this.setMessage("−1 · That item belongs in a different bin.", "error");
    this.render();
    return true;
  }

  handleKey(event) {
    if (event.key === "Escape") { this.returnToTown(); return; }
    const session = this.houseRescue.getActiveSession();
    if (!session) return;
    if (session.phase === "sorting") {
      const wave = session.items.find((item) => !item.sorted)?.wave ?? 0;
      const visible = session.items.filter((item) => !item.sorted && item.wave === wave);
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const current = visible.findIndex((item) => item.id === this.selectedItemId);
        const delta = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
        this.selectedItemId = visible[(current < 0 ? 0 : current + delta + visible.length) % visible.length]?.id || null;
        this.render();
        return;
      }
      const category = event.key === "1" ? "organic" : event.key === "2" ? "recycle" : event.key === "3" ? "garbage" : null;
      if (category) { event.preventDefault(); this.sortSelected(category); }
      return;
    }
    if (session.phase === "vacuum" && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const loadout = this.houseRescue.getVacuumLoadout();
      const step = (event.shiftKey ? 12 : 6) * loadout.speedMultiplier;
      const x = session.vacuum.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0);
      const y = session.vacuum.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
      const result = this.houseRescue.moveVacuum(x, y);
      if (result.result) this.showResult(result.result); else this.render();
    }
  }

  currentWave(session) {
    return session?.items?.find((item) => !item.sorted)?.wave ?? Math.max(0, Math.ceil((session?.items?.length || 1) / HOUSE_RESCUE_RULES.visibleItemsPerWave) - 1);
  }

  renderSorting(session) {
    if (!this.sortFloor) return;
    const wave = this.currentWave(session);
    const visible = session.items.filter((item) => !item.sorted && item.wave === wave);
    this.sortFloor.innerHTML = visible.map((item) => `<button type="button" draggable="true" class="house-rescue-item${item.id === this.selectedItemId ? " selected" : ""}" data-house-rescue-item="${item.id}" style="left:${item.x}%;top:${item.y}%" aria-label="${item.label}, ${item.category}"><span>${item.icon}</span><small>${item.label}</small></button>`).join("");
    setText("#house-rescue-wave", `${wave + 1} / ${Math.ceil(session.items.length / HOUSE_RESCUE_RULES.visibleItemsPerWave)}`);
    setText("#house-rescue-remaining", session.items.length - session.correct);
  }

  renderVacuum(session) {
    if (!this.vacuumFloor) return;
    const remaining = session.dirt.filter((stain) => stain.remaining > 0);
    const vacuum = this.houseRescue.getVacuumLoadout();
    this.vacuumFloor.innerHTML = `${remaining.map((stain) => `<i class="house-rescue-stain strength-${stain.strength}" style="left:${stain.x}%;top:${stain.y}%;--stain-size:${5 + stain.remaining * 2}px" aria-hidden="true"></i>`).join("")}<span class="house-rescue-vacuum" style="left:${session.vacuum.x}%;top:${session.vacuum.y}%;--vacuum-color:${vacuum.color}" aria-hidden="true">${vacuum.icon}</span>`;
    setText("#house-rescue-layers", remaining.reduce((sum, stain) => sum + stain.remaining, 0));
  }

  render() {
    const progress = this.houseRescue.getSnapshot();
    const session = progress.active;
    const picker = document.querySelector("#house-rescue-picker");
    const gameplay = document.querySelector("#house-rescue-gameplay");
    if (!session) {
      picker?.classList.remove("hidden");
      gameplay?.classList.add("hidden");
      if (this.levelSelect) {
        if (this.levelSelect.options.length !== progress.unlockedLevel) this.levelSelect.innerHTML = Array.from({ length: progress.unlockedLevel }, (_, index) => `<option value="${index + 1}">Level ${index + 1} · ${houseRescueLevel(index + 1).label}</option>`).join("");
        this.levelSelect.value = String(progress.selectedLevel);
      }
      if (this.startButton) this.startButton.textContent = `Start Level ${progress.selectedLevel}`;
    } else {
      picker?.classList.add("hidden");
      gameplay?.classList.remove("hidden");
      const config = houseRescueLevel(session.level);
      const coverage = houseRescueCoverage(session.dirt);
      setText("#house-rescue-level-name", `Level ${session.level} of 750 · ${config.label}`);
      setText("#house-rescue-score", session.score);
      setText("#house-rescue-mistakes", session.mistakes);
      setText("#house-rescue-coverage", `${Math.round(coverage * 100)}%`);
      const vacuum = this.houseRescue.getVacuumLoadout();
      setText("#house-rescue-vacuum-tool", `${vacuum.icon} ${vacuum.name} · power ${vacuum.power}`);
      document.querySelector("#house-rescue-sort-stage")?.classList.toggle("active", session.phase === "sorting");
      document.querySelector("#house-rescue-sort-stage")?.classList.toggle("done", session.phase === "vacuum");
      document.querySelector("#house-rescue-vacuum-stage")?.classList.toggle("active", session.phase === "vacuum");
      document.querySelector("#house-rescue-sort-panel")?.classList.toggle("hidden", session.phase !== "sorting");
      document.querySelector("#house-rescue-vacuum-panel")?.classList.toggle("hidden", session.phase !== "vacuum");
      if (session.phase === "sorting") this.renderSorting(session); else this.renderVacuum(session);
    }
    setText("#house-rescue-progress-summary", `${progress.completed} rescued · ${progress.totalStars} stars · Level ${progress.unlockedLevel} unlocked`);
    setText("#house-rescue-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    const game = document.querySelector("#game");
    if (game) {
      game.dataset.scene = this.scene.key;
      game.dataset.houseRescueLevel = String(session?.level || progress.selectedLevel);
      game.dataset.houseRescuePhase = session?.phase || "picker";
      game.dataset.houseRescueCoverage = String(Math.round(houseRescueCoverage(session?.dirt) * 100));
      game.dataset.houseRescueCatalogue = "750";
    }
  }

  completeQa() {
    const result = this.houseRescue.qaComplete();
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.showResult(result.result);
    return true;
  }

  showResult(result) {
    document.querySelector("#house-rescue-picker")?.classList.add("hidden");
    document.querySelector("#house-rescue-gameplay")?.classList.add("hidden");
    document.querySelector("#house-rescue-result")?.classList.remove("hidden");
    setText("#house-rescue-result-title", `Level ${result.level} complete · the cottage is sparkling!`);
    setText("#house-rescue-result-stars", `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`);
    setText("#house-rescue-result-message", `All rubbish was sorted and ${Math.round(result.completionCoverage * 100)}% of the floor's stain layers were removed.`);
    setText("#house-rescue-result-score", result.score);
    setText("#house-rescue-result-accuracy", `${Math.round(result.accuracy * 100)}%`);
    setText("#house-rescue-result-coins", `+${result.coins}`);
    const progress = this.houseRescue.getSnapshot();
    setText("#house-rescue-progress-summary", `${progress.completed} rescued · ${progress.totalStars} stars · Level ${progress.unlockedLevel} unlocked`);
    setText("#house-rescue-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    const game = document.querySelector("#game");
    if (game) {
      game.dataset.houseRescuePhase = "result";
      game.dataset.houseRescueCoverage = String(Math.round(result.completionCoverage * 100));
    }
    this.setMessage("House rescued, reward committed, and progress saved safely.", "success");
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#house-rescue-status");
    if (element) { element.textContent = message || "Continue helping this home."; element.dataset.status = status; }
  }

  returnToTown() {
    if (this.transitioning) return false;
    this.transitioning = true;
    const session = this.houseRescue.getActiveSession();
    const returnPosition = session?.returnPosition || this.entryData.returnPosition;
    const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.cameras.main.fadeOut(180, 53, 42, 35);
    this.time.delayedCall(200, () => {
      if (this.entryData.returnScene === "HouseInteriorScene" && this.entryData.returnHouseId) {
        this.scene.start("HouseInteriorScene", { houseId: this.entryData.returnHouseId, returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 });
      } else this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 });
    });
    return true;
  }

  shutdownScene() {
    this.worldSimulation?.setPaused("activity", false);
    this.npcTownLife?.setPaused("activity", false);
    this.hud?.classList.add("hidden");
    this.startButton?.removeEventListener("click", this.onStart);
    this.exitButton?.removeEventListener("click", this.onExit);
    this.qaButton?.removeEventListener("click", this.onQa);
    this.resultButtons.return?.removeEventListener("click", this.onReturn);
    this.resultButtons.next?.removeEventListener("click", this.onNextHome);
    this.bins?.removeEventListener("click", this.onBinClick);
    this.bins?.removeEventListener("dragover", this.onBinDragOver);
    this.bins?.removeEventListener("drop", this.onBinDrop);
    this.sortFloor?.removeEventListener("click", this.onSortFloorClick);
    this.sortFloor?.removeEventListener("dragstart", this.onSortDragStart);
    this.vacuumFloor?.removeEventListener("pointerdown", this.onVacuumPointer);
    this.vacuumFloor?.removeEventListener("pointermove", this.onVacuumPointer);
    this.vacuumFloor?.removeEventListener("pointerup", this.onVacuumPointerUp);
    this.vacuumFloor?.removeEventListener("pointercancel", this.onVacuumPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    delete document.body.dataset.gameScene;
  }
}
