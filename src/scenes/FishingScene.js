import Phaser from "phaser";
import {
  FISHING_CONFIG,
  FISHING_SPOT_BY_ID,
  MAGNET_FISHING_CONFIG,
  MAGNET_FISHING_SPOT,
  TARGETING_CONFIG,
  fishingItem,
  pointInWater,
} from "../data/fishing.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class FishingScene extends Phaser.Scene {
  constructor() {
    super("FishingScene");
  }

  create() {
    this.fishing = this.registry.get("fishing");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.session = this.fishing?.getActiveSession?.();
    if (!this.session) {
      this.scene.start("TownScene");
      return;
    }
    this.mode = this.session.mode;
    this.spot = this.mode === "magnet" ? MAGNET_FISHING_SPOT : FISHING_SPOT_BY_ID[this.session.spotId];
    this.phase = "idle";
    this.transitioning = false;
    this.biteStartedAt = 0;
    this.pendingTimers = [];
    this.qaMode = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("qa") : null;
    this.timingScale = this.qaMode === "fishing" || this.qaMode === "magnet" ? 0.28 : 1;
    const firstZone = this.session.hiddenZones[0];
    this.target = this.qaMode && firstZone
      ? { x: firstZone.x, y: firstZone.y }
      : { x: TARGETING_CONFIG.waterArea.x + TARGETING_CONFIG.waterArea.width * 0.62, y: TARGETING_CONFIG.waterArea.y + TARGETING_CONFIG.waterArea.height * 0.52 };

    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawScene();
    this.bindInterface();
    this.setSceneInterface();
    this.refreshInterface(this.mode === "magnet" ? "Choose a river point for the recovery magnet." : "Choose an exact water point for your cast.");
    this.cameras.main.fadeIn(220, 12, 35, 42);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawScene() {
    const magnet = this.mode === "magnet";
    const reedbank = this.spot.id === "fishing-reedbank";
    const harbour = this.spot.id === "fishing-harbour";
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, magnet ? 0x173e48 : 0x4f8450);
    const art = this.add.graphics();
    art.fillStyle(magnet ? 0x233c3f : harbour ? 0xc5a96f : 0x72a957, 1);
    art.fillRect(0, 0, ROOM.width, 134);
    art.fillStyle(magnet ? 0x237e91 : harbour ? 0x1687a5 : reedbank ? 0x1687a5 : 0x3a98ad, 1);
    art.fillRoundedRect(TARGETING_CONFIG.waterArea.x, TARGETING_CONFIG.waterArea.y, TARGETING_CONFIG.waterArea.width, TARGETING_CONFIG.waterArea.height, 26);
    art.lineStyle(7, 0x172638, 0.95);
    art.strokeRoundedRect(TARGETING_CONFIG.waterArea.x, TARGETING_CONFIG.waterArea.y, TARGETING_CONFIG.waterArea.width, TARGETING_CONFIG.waterArea.height, 26);
    art.lineStyle(3, 0x8ed9dc, 0.38);
    for (let row = 0; row < 6; row += 1) art.lineBetween(155 + (row % 2) * 55, 195 + row * 54, 1115 - (row % 3) * 42, 195 + row * 54);

    if (magnet) this.drawBridge(art);
    else this.drawFishingBank(art, reedbank, harbour);

    this.add.text(34, 28, `${this.spot.icon} ${this.spot.shortTitle.toUpperCase()}`, {
      color: "#fff1c8", fontFamily: "ui-monospace, monospace", fontSize: "25px", fontStyle: "bold",
      backgroundColor: "#172638", padding: { x: 13, y: 8 },
    }).setDepth(10);
    this.add.text(36, 86, this.spot.waterBody, { color: "#fff6d8", fontFamily: "system-ui", fontSize: "15px", fontStyle: "bold" }).setDepth(10);

    this.aim = this.add.circle(this.target.x, this.target.y, 24, 0xfff0a0, 0.18).setStrokeStyle(4, 0xfff0a0, 0.92).setDepth(20);
    this.aimInner = this.add.circle(this.target.x, this.target.y, 5, 0xfff0a0, 1).setDepth(21);
    this.line = this.add.graphics().setDepth(25);
    this.resultIcon = this.add.text(this.target.x, this.target.y - 20, magnet ? "🧲" : "🎣", { fontSize: "45px" }).setOrigin(0.5).setVisible(false).setDepth(30);
    this.input.on("pointerdown", (pointer) => {
      if (this.transitioning || !pointInWater(pointer)) return;
      this.setTarget(pointer.x, pointer.y);
      if (["idle", "success", "miss"].includes(this.phase)) this.cast();
    });
  }

  drawFishingBank(art, reedbank, harbour) {
    art.fillStyle(harbour ? 0xd0b072 : 0x6fa050, 1);
    art.fillRect(0, 540, ROOM.width, 180);
    art.fillStyle(0x6d432c, 1);
    art.fillRect(465, 500, 350, 220);
    art.fillStyle(0xb97b43, 1);
    for (let y = 508; y < 720; y += 30) art.fillRect(476, y, 328, 21);
    if (reedbank) {
      for (const [x, y] of [[180, 230], [320, 410], [930, 230], [1040, 440], [720, 300]]) {
        art.fillStyle(0x4d8939, 1); art.fillEllipse(x, y, 64, 28); art.fillStyle(0xf2a5b8, 1); art.fillCircle(x + 8, y - 5, 7);
      }
    }
    this.add.text(410, 610, "🧍", { fontSize: "70px" }).setOrigin(0.5).setDepth(15);
    this.add.text(390, 562, "🎣", { fontSize: "60px" }).setOrigin(0.5).setAngle(-24).setDepth(16);
  }

  drawBridge(art) {
    art.fillStyle(0x523b31, 1);
    art.fillRect(0, 520, ROOM.width, 200);
    art.fillStyle(0xb77b42, 1);
    for (let x = 0; x < ROOM.width; x += 92) art.fillRect(x + 7, 532, 75, 180);
    art.fillStyle(0x172638, 1);
    art.fillRect(0, 515, ROOM.width, 15);
    this.add.text(155, 575, "🧍", { fontSize: "70px" }).setOrigin(0.5).setDepth(15);
    this.add.text(210, 574, "🪢", { fontSize: "37px" }).setOrigin(0.5).setDepth(16);
  }

  setTarget(x, y) {
    if (!pointInWater({ x, y }) || !["idle", "success", "miss"].includes(this.phase)) return false;
    this.target = { x, y };
    this.aim.setPosition(x, y);
    this.aimInner.setPosition(x, y);
    return true;
  }

  cast() {
    if (!this.session || !["idle", "success", "miss"].includes(this.phase)) return false;
    const result = this.fishing.cast(this.target);
    if (!result.ok) {
      this.refreshInterface(result.message || "That cast is not available.", "error");
      return false;
    }
    this.phase = "casting";
    this.resultIcon.setText(this.mode === "magnet" ? "🧲" : "🎣").setPosition(270, 555).setVisible(true).setAlpha(1).setScale(1);
    this.aim.setVisible(false);
    this.aimInner.setVisible(false);
    this.drawLine(250, 540, this.target.x, this.target.y);
    this.tweens.add({ targets: this.resultIcon, x: this.target.x, y: this.target.y, duration: this.duration(this.mode === "magnet" ? MAGNET_FISHING_CONFIG.castAnimationMs : FISHING_CONFIG.castAnimationMs), ease: "Sine.easeInOut" });
    this.refreshInterface(this.mode === "magnet" ? "Magnet away—letting it settle on the riverbed…" : "Float away—watch the water for a bite.");
    const wait = this.mode === "magnet"
      ? MAGNET_FISHING_CONFIG.castAnimationMs + MAGNET_FISHING_CONFIG.sinkAnimationMs + MAGNET_FISHING_CONFIG.settleAnimationMs
      : FISHING_CONFIG.castAnimationMs + (result.potentialCatch
        ? this.randomDelay(FISHING_CONFIG.biteDelayMinMs, FISHING_CONFIG.biteDelayMaxMs)
        : this.randomDelay(TARGETING_CONFIG.emptyWaitMinMs, TARGETING_CONFIG.emptyWaitMaxMs));
    this.later(wait, () => this.readyCast());
    return true;
  }

  readyCast() {
    if (this.transitioning || this.phase !== "casting") return;
    const result = this.fishing.signalReady();
    if (this.mode === "magnet" && result.ok) {
      this.phase = "ready";
      this.resultIcon.setText("🧲").setPosition(this.target.x, this.target.y + 18);
      this.refreshInterface("Riverbed contact! Retrieve the magnet now.", "bite");
      return;
    }
    if (result.code === "fish-bite") {
      this.phase = "bite";
      this.biteStartedAt = performance.now();
      this.resultIcon.setText("❗").setPosition(this.target.x, this.target.y - 24);
      this.refreshInterface("BITE! Reel in before the fish escapes!", "bite");
      this.later(FISHING_CONFIG.biteWindowMs, () => {
        if (this.phase !== "bite") return;
        const missed = this.fishing.miss("late");
        this.phase = "miss";
        this.showResult("💦");
        this.refreshInterface(missed.ok ? "The fish escaped. Choose another point and cast again." : missed.message, "error");
      });
    } else {
      this.phase = "miss";
      this.showResult("💦");
      this.refreshInterface("Quiet water—there was no catch at that point. Try somewhere else.", "error");
    }
  }

  reel() {
    if (this.phase !== "bite" && this.phase !== "ready") {
      this.refreshInterface(this.mode === "magnet" ? "Let the magnet settle first." : "Wait for BITE before reeling in.", "error");
      return false;
    }
    const quality = this.phase === "bite" ? Math.max(0, 1 - (performance.now() - this.biteStartedAt) / this.duration(FISHING_CONFIG.biteWindowMs)) : 1;
    this.phase = "reeling";
    this.refreshInterface(this.mode === "magnet" ? "Pulling the recovery magnet back to Mill Bridge…" : "Fish on the line—bringing it safely ashore…", "bite");
    this.tweens.add({ targets: this.resultIcon, x: this.mode === "magnet" ? 225 : 390, y: 560, duration: this.duration(this.mode === "magnet" ? MAGNET_FISHING_CONFIG.reelAnimationMs : FISHING_CONFIG.reelAnimationMs), ease: "Sine.easeInOut" });
    this.later(this.mode === "magnet" ? MAGNET_FISHING_CONFIG.reelAnimationMs : FISHING_CONFIG.reelAnimationMs, () => {
      if (this.transitioning || this.phase !== "reeling") return;
      const result = this.mode === "magnet"
        ? this.fishing.retrieveMagnet({ forcedRecoveryId: this.qaMode === "magnet" ? "sealed-coin-tin" : null })
        : this.fishing.reelFish({ quality, forcedItemId: this.qaMode === "fishing" ? this.spot.catchTable[0].itemId : null });
      if (!result.ok) {
        this.phase = "miss";
        this.refreshInterface(result.message || "The reward could not be saved.", "error");
        return;
      }
      this.phase = result.empty ? "miss" : "success";
      if (result.empty) {
        this.showResult("🧲");
        this.refreshInterface("Nothing on the magnet. Try a different part of the river.", "error");
      } else if (this.mode === "magnet") {
        this.showResult(result.recovery.icon);
        this.refreshInterface(`${result.recovery.rarity.toUpperCase()} FIND · ${result.recovery.name} · +${result.rewardCoins} coins!`, "success", result);
      } else {
        this.showResult(result.item.icon);
        const message = result.disposition === "aquarium"
          ? `${result.item.name} safely joined your home aquarium · ${result.aquarium.totalFish} fish across ${result.aquarium.species.length} species.`
          : result.disposition === "released-no-tank"
            ? `${result.item.name} was safely returned to Reedbank. Buy and place a home fish tank to keep future ornamental catches.`
            : result.disposition === "released-full"
              ? `${result.item.name} was safely returned because that species section of the tank is full.`
              : `${result.item.name} added to your inventory.`;
        this.refreshInterface(message, "success", result);
      }
    });
    return true;
  }

  showResult(icon) {
    this.resultIcon.setText(icon).setVisible(true).setAlpha(1).setScale(1.2).setPosition(this.target.x, this.target.y - 16);
    this.aim.setVisible(true).setPosition(this.target.x, this.target.y);
    this.aimInner.setVisible(true).setPosition(this.target.x, this.target.y);
    this.tweens.add({ targets: this.resultIcon, y: this.resultIcon.y - 22, duration: 380, yoyo: true, ease: "Sine.easeOut" });
  }

  drawLine(fromX, fromY, toX, toY) {
    this.line.clear();
    this.line.lineStyle(3, 0xfff4cf, 0.9);
    this.line.lineBetween(fromX, fromY, toX, toY);
  }

  duration(milliseconds) {
    return Math.max(70, Math.round(milliseconds * this.timingScale));
  }

  randomDelay(minimum, maximum) {
    if (this.qaMode === "fishing" || this.qaMode === "magnet") return minimum;
    return Phaser.Math.Between(minimum, maximum);
  }

  later(milliseconds, callback) {
    const timer = this.time.delayedCall(this.duration(milliseconds), callback);
    this.pendingTimers.push(timer);
    return timer;
  }

  bindInterface() {
    this.hud = document.querySelector("#fishing-hud");
    this.status = document.querySelector("#fishing-status");
    this.castButton = document.querySelector("#fishing-cast");
    this.reelButton = document.querySelector("#fishing-reel");
    this.exitButton = document.querySelector("#fishing-exit");
    this.onCast = () => this.cast();
    this.onReel = () => this.reel();
    this.onExit = () => this.returnToTown();
    this.castButton?.addEventListener("click", this.onCast);
    this.reelButton?.addEventListener("click", this.onReel);
    this.exitButton?.addEventListener("click", this.onExit);
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); this.returnToTown(); return; }
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        if (["bite", "ready"].includes(this.phase)) this.reel();
        else if (["idle", "success", "miss"].includes(this.phase)) this.cast();
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || !["idle", "success", "miss"].includes(this.phase)) return;
      event.preventDefault();
      const dx = event.key === "ArrowLeft" ? -34 : event.key === "ArrowRight" ? 34 : 0;
      const dy = event.key === "ArrowUp" ? -28 : event.key === "ArrowDown" ? 28 : 0;
      const area = TARGETING_CONFIG.waterArea;
      this.setTarget(Phaser.Math.Clamp(this.target.x + dx, area.x, area.x + area.width), Phaser.Math.Clamp(this.target.y + dy, area.y, area.y + area.height));
    };
    window.addEventListener("keydown", this.onKeyDown);
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const location = document.querySelector("#location-status");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = `${this.mode === "magnet" ? "MAGNET FISHING" : this.spot.id === "fishing-reedbank" ? "FISHING + HOME AQUARIUM" : "FISHING"} · MILESTONE ${this.mode === "magnet" ? 15 : 33}`;
    if (location) location.textContent = this.spot.title;
    if (hint) hint.textContent = "Tap water or use arrows to aim · Enter/Space casts or reels · Escape exits safely";
    document.querySelector("#fishing-mode-label").textContent = this.mode === "magnet" ? "MAGNET FISHING" : "FISHING";
    document.querySelector("#fishing-title").textContent = `${this.spot.icon} ${this.spot.shortTitle}`;
    const aquarium = this.fishing.getSnapshot().aquarium;
    const aquariumHelp = this.spot.id !== "fishing-reedbank" ? "" : aquarium.placed
      ? ` ${aquarium.totalFish} ornamental fish currently live in your placed home tank.`
      : " No tank is placed, so ornamental catches will be safely released.";
    document.querySelector("#fishing-description").textContent = `${this.spot.description}${aquariumHelp}`;
    this.hud?.classList.remove("hidden");
  }

  refreshInterface(message, status = "neutral", result = null) {
    const progress = this.fishing.getSnapshot();
    const castsLeft = this.fishing.castsLeft(this.mode);
    if (this.status) { this.status.textContent = message; this.status.dataset.status = status; }
    document.querySelector("#fishing-casts").textContent = `${castsLeft} / 5`;
    document.querySelector("#fishing-total").textContent = String(this.mode === "magnet" ? progress.magnet.totalPulls : progress.totalCaught);
    document.querySelector("#fishing-streak").textContent = String(this.mode === "magnet" ? progress.magnet.currentPullStreak : progress.currentStreak);
    const catchList = document.querySelector("#fishing-catch-list");
    if (catchList) catchList.textContent = this.mode === "magnet"
      ? "8 named finds · common to legendary"
      : this.spot.catchTable.map((entry) => fishingItem(entry.itemId)?.name).filter(Boolean).join(" · ");
    if (this.castButton) {
      this.castButton.disabled = !["idle", "success", "miss"].includes(this.phase) || castsLeft < 1;
      this.castButton.textContent = castsLeft < 1 ? "More casts tomorrow" : `${this.mode === "magnet" ? "🧲" : "🎣"} Cast here`;
    }
    if (this.reelButton) {
      this.reelButton.disabled = !["bite", "ready"].includes(this.phase);
      this.reelButton.classList.toggle("bite", ["bite", "ready"].includes(this.phase));
      this.reelButton.textContent = this.mode === "magnet" ? "🪢 Retrieve magnet" : "⚡ Reel in";
    }
    if (result) document.querySelector("#fishing-last-result").textContent = this.mode === "magnet"
      ? `${result.recovery.icon} ${result.recovery.name} · +${result.rewardCoins} coins`
      : `${result.item.icon} ${result.item.name} · ${result.disposition === "inventory" ? "inventory" : result.disposition === "aquarium" ? `home aquarium · ${result.aquarium.totalFish} fish` : "safely released"}`;
    this.updateDomState();
  }

  updateDomState() {
    const game = document.querySelector("#game");
    if (!game) return;
    game.dataset.scene = this.scene.key;
    game.dataset.fishingMode = this.mode;
    game.dataset.fishingPhase = this.phase;
    game.dataset.fishingCastsLeft = String(this.fishing.castsLeft(this.mode));
    game.dataset.fishingTarget = `${Math.round(this.target.x)},${Math.round(this.target.y)}`;
  }

  returnToTown() {
    if (this.transitioning) return false;
    this.transitioning = true;
    const session = this.fishing.getActiveSession();
    this.fishing.cancel();
    this.cameras.main.fadeOut(220, 12, 35, 42);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition: session?.returnPosition, returnFacing: session?.returnFacing || "down" }));
    return true;
  }

  shutdownScene() {
    for (const timer of this.pendingTimers) timer.remove(false);
    this.castButton?.removeEventListener("click", this.onCast);
    this.reelButton?.removeEventListener("click", this.onReel);
    this.exitButton?.removeEventListener("click", this.onExit);
    window.removeEventListener("keydown", this.onKeyDown);
    this.hud?.classList.add("hidden");
    this.fishing?.cancel?.();
    this.worldSimulation?.setPaused("activity", false);
    this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return { scene: this.scene.key, mode: this.mode, spotId: this.spot.id, phase: this.phase, castsLeft: this.fishing.castsLeft(this.mode), persistent: true, inventoryRewards: true, aquarium: this.fishing.getSnapshot().aquarium };
  }
}
