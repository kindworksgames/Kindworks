import Phaser from "phaser";

const ROOM = Object.freeze({ width: 1280, height: 720 });

export class WasteCollectionScene extends Phaser.Scene {
  constructor() {
    super("WasteCollectionScene");
    this.itemObjects = new Map();
    this.collected = new Set();
    this.selectedIndex = 0;
    this.finishing = false;
    this.finished = false;
    this.transitioning = false;
  }

  create() {
    this.cleanupService = this.registry.get("cleanupService");
    this.session = this.cleanupService?.getActiveSession();
    this.job = this.session ? this.cleanupService.getJob(this.session.targetId) : null;
    if (!this.session || !this.job) {
      this.scene.start("TownScene");
      return;
    }
    this.worldSimulation = this.registry.get("worldSimulation");
    this.worldSimulation?.setPaused("activity", true);

    this.itemObjects = new Map();
    this.collected = new Set();
    this.selectedIndex = 0;
    this.finishing = false;
    this.finished = false;
    this.transitioning = false;
    this.drawPark();
    for (const item of this.job.items) this.drawRubbish(item);
    this.bindInterface();
    this.setSceneInterface();
    this.refreshInterface("Choose a piece of rubbish on the park or in the accessible list.");
    this.cameras.main.fadeIn(220, 30, 56, 39);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
    this.updateDomState();
  }

  drawPark() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x8bc86f);
    const ground = this.add.graphics();
    ground.fillStyle(0xa0d584, 0.6);
    ground.fillRoundedRect(210, 120, 970, 500, 46);
    ground.fillStyle(0xd9c29a, 1);
    ground.fillRoundedRect(190, 318, 1010, 86, 28);
    ground.fillStyle(0x765238, 1);
    ground.fillRect(1080, 95, 18, 78);
    ground.fillStyle(0x4e9a4f, 1);
    ground.fillCircle(1089, 78, 58);
    ground.fillStyle(0x6eaa58, 1);
    ground.fillCircle(1058, 82, 32);
    ground.fillCircle(1121, 91, 35);
    ground.fillStyle(0x765238, 1);
    ground.fillRoundedRect(1110, 520, 90, 30, 5);
    ground.fillStyle(0xcaa36d, 1);
    ground.fillRect(1098, 493, 114, 26);
    ground.fillRect(1107, 550, 12, 42);
    ground.fillRect(1190, 550, 12, 42);
    for (let index = 0; index < 70; index += 1) {
      const x = 235 + ((index * 137) % 920);
      const y = 140 + ((index * 83) % 450);
      ground.fillStyle(index % 3 === 0 ? 0x6eaa58 : 0xb2dc91, 0.38);
      ground.fillCircle(x, y, 2 + (index % 3));
    }

    this.add.text(ROOM.width / 2, 56, "WASTE COLLECTION", {
      color: "#fff9df",
      fontFamily: "system-ui, sans-serif",
      fontSize: "31px",
      fontStyle: "bold",
      letterSpacing: 3,
      stroke: "#294637",
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(ROOM.width / 2, 91, `${this.job.title} · Level ${this.session.assignedLevel}`, {
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 249, 223, 0.84)",
      padding: { x: 12, y: 5 },
    }).setOrigin(0.5);
  }

  drawRubbish(item) {
    const shadow = this.add.ellipse(0, 22, 76, 23, 0x294637, 0.2);
    const backing = this.add.rectangle(0, 0, 78, 64, item.color, 0.96).setStrokeStyle(4, 0x294637, 0.72);
    const icon = this.add.text(0, -5, item.icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "31px" }).setOrigin(0.5);
    const label = this.add.text(0, 37, item.label, {
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 253, 241, 0.9)",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5);
    const object = this.add.container(item.x, item.y, [shadow, backing, icon, label])
      .setSize(108, 100)
      .setInteractive({ useHandCursor: true });
    object.on("pointerdown", () => this.collectItem(item.id));
    object.setData("itemId", item.id);
    this.itemObjects.set(item.id, object);
  }

  bindInterface() {
    this.hud = document.querySelector("#cleanup-hud");
    this.itemList = document.querySelector("#cleanup-item-list");
    this.progress = document.querySelector("#cleanup-progress");
    this.progressText = document.querySelector("#cleanup-progress-text");
    this.status = document.querySelector("#cleanup-status");
    this.finishButton = document.querySelector("#cleanup-finish");
    this.exitButton = document.querySelector("#cleanup-exit");
    this.resultPanel = document.querySelector("#cleanup-result");
    this.resultCoins = document.querySelector("#cleanup-result-coins");
    this.resultBalance = document.querySelector("#cleanup-result-balance");
    this.resultReturn = document.querySelector("#cleanup-result-return");

    if (this.itemList) {
      this.itemList.innerHTML = this.job.items.map((item, index) => (
        `<button type="button" data-cleanup-item="${item.id}" aria-label="Collect ${item.label}"><span aria-hidden="true">${item.icon}</span><span>${index + 1}. ${item.label}</span></button>`
      )).join("");
    }
    this.onItemClick = (event) => {
      const button = event.target.closest("[data-cleanup-item]");
      if (button) this.collectItem(button.dataset.cleanupItem);
    };
    this.onFinish = () => this.finishJob();
    this.onExit = () => this.cancelAndReturn();
    this.onResultReturn = () => this.returnToTown();
    this.itemList?.addEventListener("click", this.onItemClick);
    this.finishButton?.addEventListener("click", this.onFinish);
    this.exitButton?.addEventListener("click", this.onExit);
    this.resultReturn?.addEventListener("click", this.onResultReturn);

    this.onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.finished) this.returnToTown();
        else this.cancelAndReturn();
        return;
      }
      if (this.finished || this.finishing || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      const remaining = this.job.items.filter((item) => !this.collected.has(item.id));
      if (!remaining.length) return;
      if (event.key === "Enter" || event.key === " ") this.collectItem(remaining[this.selectedIndex % remaining.length].id);
      else {
        const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
        this.selectedIndex = (this.selectedIndex + direction + remaining.length) % remaining.length;
        this.updateSelection();
      }
    };
    window.addEventListener("keydown", this.onKeyDown);
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const status = document.querySelector("#location-status");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = "WASTE COLLECTION · MILESTONE 8";
    if (status) status.textContent = `${this.job.title} · Level ${this.session.assignedLevel}`;
    if (hint) hint.textContent = "Tap rubbish to collect · Arrow keys choose · Enter or Space collects · Escape exits safely";
    this.hud?.classList.remove("hidden");
    this.resultPanel?.classList.add("hidden");
    this.resultPanel?.setAttribute("aria-hidden", "true");
  }

  updateSelection() {
    const remaining = this.job.items.filter((item) => !this.collected.has(item.id));
    if (!remaining.length) return;
    this.selectedIndex %= remaining.length;
    const selectedId = remaining[this.selectedIndex].id;
    for (const [id, object] of this.itemObjects) if (!this.collected.has(id)) object.setScale(id === selectedId ? 1.12 : 1);
    for (const button of this.itemList?.querySelectorAll("[data-cleanup-item]") || []) button.classList.toggle("selected", button.dataset.cleanupItem === selectedId);
  }

  collectItem(itemId) {
    if (this.finished || this.finishing || this.collected.has(itemId)) return false;
    const item = this.job.items.find((candidate) => candidate.id === itemId);
    const object = this.itemObjects.get(itemId);
    if (!item || !object) return false;
    this.collected.add(itemId);
    object.disableInteractive();
    this.tweens.add({ targets: object, y: object.y - 26, alpha: 0, scale: 0.45, duration: 210, ease: "Back.easeIn" });
    const sparkle = this.add.text(object.x, object.y - 24, "✨", { fontSize: "28px" }).setOrigin(0.5);
    this.tweens.add({ targets: sparkle, y: sparkle.y - 38, alpha: 0, duration: 420, onComplete: () => sparkle.destroy() });
    this.selectedIndex = 0;
    this.refreshInterface(`${item.label} collected. ${this.job.items.length - this.collected.size} remaining.`);
    if (this.collected.size === this.job.items.length) this.time.delayedCall(260, () => this.finishJob());
    return true;
  }

  refreshInterface(message) {
    const total = this.job.items.length;
    const count = this.collected.size;
    if (this.progress) {
      this.progress.max = total;
      this.progress.value = count;
      this.progress.textContent = `${count} of ${total}`;
      this.progress.setAttribute("aria-valuetext", `${count} of ${total} pieces collected`);
    }
    if (this.progressText) this.progressText.textContent = `${count} / ${total} collected`;
    if (this.status && message) this.status.textContent = message;
    if (this.finishButton) this.finishButton.disabled = count !== total || this.finishing || this.finished;
    for (const button of this.itemList?.querySelectorAll("[data-cleanup-item]") || []) {
      const collected = this.collected.has(button.dataset.cleanupItem);
      button.disabled = collected || this.finishing || this.finished;
      button.classList.toggle("collected", collected);
      if (collected) button.setAttribute("aria-label", `${button.textContent.trim()}, collected`);
    }
    this.updateSelection();
    this.updateDomState();
  }

  finishJob() {
    if (this.finished || this.finishing || this.collected.size !== this.job.items.length) return false;
    this.finishing = true;
    this.refreshInterface("Saving the restored park and reward…");
    const result = this.cleanupService.complete(this.session.id, { collectedItemIds: [...this.collected] });
    if (!result.ok) {
      this.finishing = false;
      this.refreshInterface(result.message || "The result could not be saved. Try Finish cleanup again.");
      return false;
    }
    this.finished = true;
    this.finishing = false;
    if (this.resultCoins) this.resultCoins.textContent = `+${result.rewardCoins}`;
    if (this.resultBalance) this.resultBalance.textContent = String(result.balance);
    this.resultPanel?.classList.remove("hidden");
    this.resultPanel?.setAttribute("aria-hidden", "false");
    this.refreshInterface(`Area cleaned! ${result.rewardCoins} KindlyCoins saved.`);
    requestAnimationFrame(() => this.resultReturn?.focus({ preventScroll: true }));
    return true;
  }

  cancelAndReturn() {
    if (this.transitioning || this.finished) return false;
    const result = this.cleanupService.cancel(this.session.id);
    if (!result.ok) {
      this.refreshInterface(result.message || "The job could not be closed safely.");
      return false;
    }
    this.returnToTown();
    return true;
  }

  returnToTown() {
    if (this.transitioning) return false;
    this.transitioning = true;
    this.cameras.main.fadeOut(220, 30, 56, 39);
    this.time.delayedCall(240, () => {
      this.scene.start("TownScene", {
        returnPosition: { ...this.session.returnPosition },
        returnFacing: this.session.returnFacing,
        completedCleanupTarget: this.finished ? this.session.targetId : null,
      });
    });
    return true;
  }

  shutdownScene() {
    this.worldSimulation?.setPaused("activity", false);
    window.removeEventListener("keydown", this.onKeyDown);
    this.itemList?.removeEventListener("click", this.onItemClick);
    this.finishButton?.removeEventListener("click", this.onFinish);
    this.exitButton?.removeEventListener("click", this.onExit);
    this.resultReturn?.removeEventListener("click", this.onResultReturn);
    this.hud?.classList.add("hidden");
    this.resultPanel?.classList.add("hidden");
    this.resultPanel?.setAttribute("aria-hidden", "true");
  }

  updateDomState() {
    const gameElement = document.querySelector("#game");
    if (!gameElement) return;
    gameElement.dataset.scene = this.scene.key;
    gameElement.dataset.cleanupSession = this.session?.id || "none";
    gameElement.dataset.cleanupTarget = this.session?.targetId || "none";
    gameElement.dataset.cleanupCollected = String(this.collected.size);
    gameElement.dataset.cleanupTotal = String(this.job?.items.length || 0);
    gameElement.dataset.cleanupStatus = this.finished ? "completed" : this.finishing ? "saving" : "playing";
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      sessionId: this.session.id,
      targetId: this.session.targetId,
      assignedLevel: this.session.assignedLevel,
      collected: this.collected.size,
      total: this.job.items.length,
      finished: this.finished,
      rewardRule: "100% at Level 1 awards 100 KindlyCoins",
      input: { pointer: true, touch: true, keyboard: true, accessibleButtons: true },
    };
  }
}
